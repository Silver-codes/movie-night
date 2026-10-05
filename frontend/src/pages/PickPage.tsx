import { AnimatePresence } from 'motion/react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMovies, useUpdateMovie } from '../api/movieHooks'
import { useConfirmPick, useCreatePick } from '../api/pickHooks'
import type { MovieFilters, PickMethod, PickRequest, PickResult } from '../api/types'
import { EmptyState } from '../components/EmptyState'
import {
  ArrowLeftIcon,
  PickIcon,
  SearchIcon,
  SoundOffIcon,
  SoundOnIcon,
  TrophyIcon,
  WeightedWheelIcon,
} from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { PickFilters } from '../components/PickFilters'
import { PickMethodCard } from '../components/PickMethodCard'
import { PickWinner } from '../components/PickWinner'
import { RateReminder } from '../components/RateReminder'
import { Skeleton } from '../components/Skeleton'
import { SpinWheel } from '../components/SpinWheel'
import { TopRatedPodium } from '../components/TopRatedPodium'
import { fireConfetti } from '../lib/confetti'
import { PICK_METHODS, pickMethodInfo, RUNTIME_LIMITS, type RuntimeLimit } from '../lib/pickMethods'
import { loadSoundEnabled, saveSoundEnabled, unlockAudio } from '../lib/tick'
import { toast } from '../lib/toast'

const ALL_WATCHLIST: MovieFilters = { status: 'watchlist' }
const DEFAULT_METHOD: PickMethod = 'wheel_weighted'

const METHOD_ICONS: Record<PickMethod, ReactNode> = {
  top_rated: <TrophyIcon className="size-6" />,
  wheel_random: <PickIcon className="size-6" />,
  wheel_weighted: <WeightedWheelIcon className="size-6" />,
}

type Stage =
  | { kind: 'choose' }
  /** Top rated: the ranking, before "Pick this". */
  | { kind: 'podium'; result: PickResult }
  /** Wheels: spinning until `landed`, then the winner shows next to the wheel. */
  | { kind: 'wheel'; result: PickResult; landed: boolean }
  /** Top rated after "Pick this". */
  | { kind: 'winner'; result: PickResult }

function parseMethod(value: string | null): PickMethod {
  return PICK_METHODS.find((m) => m.value === value)?.value ?? DEFAULT_METHOD
}

function parseMaxRuntime(value: string | null): RuntimeLimit | null {
  return RUNTIME_LIMITS.find((l) => String(l.value) === value)?.value ?? null
}

const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-ink-950 transition hover:bg-accent-strong disabled:opacity-50'

export function PickPage() {
  const [params, setParams] = useSearchParams()
  const method = parseMethod(params.get('method'))
  const maxRuntime = parseMaxRuntime(params.get('max'))
  const genre = params.get('genre')

  const watchlist = useMovies(ALL_WATCHLIST)
  const createPick = useCreatePick()
  const confirmPick = useConfirmPick()
  const updateMovie = useUpdateMovie()

  const [stage, setStage] = useState<Stage>({ kind: 'choose' })
  const [confirmedPickId, setConfirmedPickId] = useState<number | null>(null)
  const [sound, setSound] = useState(loadSoundEnabled)

  const movies = useMemo(() => watchlist.data ?? [], [watchlist.data])
  const genres = useMemo(
    () => [...new Set(movies.flatMap((m) => m.genres))].sort((a, b) => a.localeCompare(b)),
    [movies],
  )
  const toRate = movies.filter((m) => m.confirmed_pick_method !== null)
  // Same rules as the backend's candidates, for a live count before asking it.
  const inTheHat = movies.filter(
    (m) =>
      m.is_pickable &&
      (maxRuntime === null || (m.runtime !== null && m.runtime <= maxRuntime)) &&
      (genre === null || m.genres.includes(genre)),
  ).length
  const pickableCount = movies.filter((m) => m.is_pickable).length
  const hasFilters = maxRuntime !== null || genre !== null

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params)
    if (value === null) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    setParams(next, { replace: true })
  }

  function request(): PickRequest {
    return { method, max_runtime: maxRuntime ?? undefined, genre: genre ?? undefined }
  }

  function runPick(body: PickRequest = request()) {
    if (sound && pickMethodInfo(body.method).isWheel) {
      unlockAudio()
    }
    createPick.mutate(body, {
      onSuccess: (result) => {
        setStage(
          pickMethodInfo(result.method).isWheel ? { kind: 'wheel', result, landed: false } : { kind: 'podium', result },
        )
      },
      // The global toast explains it (e.g. nothing left to pick); start over.
      onError: () => setStage({ kind: 'choose' }),
    })
  }

  function onWheelDone(pickId: number) {
    setStage((s) => (s.kind === 'wheel' && s.result.pick_id === pickId ? { ...s, landed: true } : s))
    fireConfetti()
  }

  function onPickTopRated(result: PickResult) {
    setStage({ kind: 'winner', result })
    fireConfetti()
  }

  function onConfirm(result: PickResult) {
    confirmPick.mutate(result.pick_id, {
      onSuccess: () => {
        setConfirmedPickId(result.pick_id)
        toast.success(`Movie night: ${result.winner.title}`)
      },
    })
  }

  function onNotTonight(result: PickResult) {
    updateMovie.mutate(
      { id: result.winner.id, update: { skipped_tonight: true } },
      {
        onSuccess: () => {
          toast.info(`${result.winner.title} is out for tonight`)
          runPick({ method: result.method, max_runtime: maxRuntime ?? undefined, genre: genre ?? undefined })
        },
      },
    )
  }

  function toggleSound() {
    setSound((on) => {
      saveSoundEnabled(!on)
      return !on
    })
  }

  const backToChoose = () => setStage({ kind: 'choose' })
  const busy = createPick.isPending || confirmPick.isPending || updateMovie.isPending

  let content: ReactNode
  if (watchlist.isPending) {
    content = (
      <div className="flex flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {PICK_METHODS.map((m) => (
            <Skeleton key={m.value} className="h-24 rounded-2xl sm:h-40" />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    )
  } else if (watchlist.isError) {
    content = (
      <EmptyState
        title="Couldn't load the watchlist"
        action={
          <button type="button" className={primaryButtonClass} onClick={() => void watchlist.refetch()}>
            Try again
          </button>
        }
      >
        {watchlist.error.message}
      </EmptyState>
    )
  } else if (movies.length === 0) {
    content = (
      <EmptyState
        title="Nothing to pick from yet"
        icon={<PickIcon className="size-7" />}
        action={
          <Link to="/search" className={primaryButtonClass}>
            <SearchIcon className="size-5" />
            Find a movie
          </Link>
        }
      >
        Save a few movies to the watchlist first, then come back and spin.
      </EmptyState>
    )
  } else if (stage.kind === 'choose') {
    const isWheel = pickMethodInfo(method).isWheel
    content = (
      <div className="flex flex-col gap-8">
        {toRate.length > 0 && (
          <section aria-label="Waiting for your verdict" className="flex flex-col gap-2">
            {toRate.map((movie) => (
              <RateReminder key={movie.id} movie={movie} />
            ))}
          </section>
        )}

        <div role="radiogroup" aria-label="How to pick" className="grid gap-3 sm:grid-cols-3">
          {PICK_METHODS.map((m) => (
            <PickMethodCard
              key={m.value}
              method={m}
              icon={METHOD_ICONS[m.value]}
              checked={method === m.value}
              onSelect={() => setParam('method', m.value === DEFAULT_METHOD ? null : m.value)}
            />
          ))}
        </div>

        <PickFilters
          genres={genres}
          genre={genre}
          onGenreChange={(g) => setParam('genre', g)}
          maxRuntime={maxRuntime}
          onMaxRuntimeChange={(minutes) => setParam('max', minutes === null ? null : String(minutes))}
        />

        <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex flex-col gap-3 rounded-2xl bg-ink-900/90 p-4 ring-1 ring-ink-700 backdrop-blur sm:flex-row sm:items-center md:bottom-4">
          <p className="flex-1 text-sm text-muted" aria-live="polite">
            {inTheHat > 0 ? (
              <>
                <span className="text-lg font-bold text-fg">{inTheHat}</span> {inTheHat === 1 ? 'movie' : 'movies'} in
                the hat
              </>
            ) : pickableCount === 0 ? (
              'Everything on the watchlist is out for tonight.'
            ) : (
              'No movie fits these filters.'
            )}
          </p>
          <div className="flex items-center gap-2">
            {isWheel && (
              <button
                type="button"
                onClick={toggleSound}
                aria-pressed={sound}
                aria-label="Wheel sound"
                title={sound ? 'Sound on' : 'Sound off'}
                className="grid size-12 place-items-center rounded-xl text-muted ring-1 ring-ink-600 transition hover:text-fg"
              >
                {sound ? <SoundOnIcon className="size-5" /> : <SoundOffIcon className="size-5" />}
              </button>
            )}
            {inTheHat === 0 && hasFilters ? (
              <button
                type="button"
                className={`${primaryButtonClass} flex-1`}
                onClick={() => setParams(method === DEFAULT_METHOD ? {} : { method }, { replace: true })}
              >
                Clear filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => runPick()}
                disabled={inTheHat === 0 || createPick.isPending}
                className={`${primaryButtonClass} flex-1 text-lg`}
              >
                {createPick.isPending ? 'Picking…' : isWheel ? 'Spin the wheel' : 'Show the podium'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  } else {
    const { result } = stage
    const confirmed = confirmedPickId === result.pick_id
    const spinAgain = () => runPick({ ...request(), method: result.method })
    const canSpinAgain = stage.kind === 'wheel' && stage.landed && !confirmed && !busy
    const winner = (
      <PickWinner
        movie={result.winner}
        method={result.method}
        confirmed={confirmed}
        confirming={confirmPick.isPending}
        onConfirm={() => onConfirm(result)}
        againLabel={stage.kind === 'wheel' ? (createPick.isPending ? 'Spinning…' : 'Spin again') : 'Back'}
        onAgain={stage.kind === 'wheel' && !confirmed ? spinAgain : backToChoose}
        onNotTonight={() => onNotTonight(result)}
        busy={busy}
      />
    )

    content = (
      <div className="flex flex-col gap-6">
        <button
          type="button"
          onClick={backToChoose}
          className="inline-flex items-center gap-1.5 self-start text-sm font-medium text-muted transition hover:text-fg"
        >
          <ArrowLeftIcon className="size-4" />
          Change how we pick
        </button>

        {stage.kind === 'podium' && (
          <TopRatedPodium
            candidates={result.candidates}
            winnerId={result.winner.id}
            onPick={() => onPickTopRated(result)}
          />
        )}

        {stage.kind === 'winner' && winner}

        {stage.kind === 'wheel' && (
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="flex flex-col items-center gap-3">
              <SpinWheel
                candidates={result.candidates}
                winnerId={result.winner.id}
                spinKey={result.pick_id}
                showPercent={result.method === 'wheel_weighted'}
                sound={sound}
                onDone={() => onWheelDone(result.pick_id)}
                onSpinAgain={canSpinAgain ? spinAgain : undefined}
              />
              <p className="text-sm text-muted">
                {canSpinAgain
                  ? 'Tap the wheel to spin again'
                  : `${result.candidates.length} ${result.candidates.length === 1 ? 'movie' : 'movies'} on the wheel`}
              </p>
            </div>
            <AnimatePresence>{stage.landed && <div key={result.pick_id}>{winner}</div>}</AnimatePresence>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <PageHeader title="What are we watching?" subtitle="Go with the top rated, or let the wheel decide." />
      {content}
    </>
  )
}

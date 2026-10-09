import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useMovies, useUpdateMovie } from '../api/movieHooks'
import { useConfirmPick, useCreatePick } from '../api/pickHooks'
import type { MovieFilters, PickMethod, PickRequest, PickResult } from '../api/types'
import { PRIMARY_BUTTON_CLASS } from '../components/buttonStyles'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import {
  ArrowLeftIcon,
  PickIcon,
  SearchIcon,
  TrophyIcon,
  WeightedWheelIcon,
} from '../components/NavIcons'
import { PageHeader } from '../components/PageHeader'
import { PickFilters } from '../components/PickFilters'
import { PickMethodCard } from '../components/PickMethodCard'
import { PickActions } from '../components/PickActions'
import { PickWinner } from '../components/PickWinner'
import { RateReminder } from '../components/RateReminder'
import { Skeleton } from '../components/Skeleton'
import { SoundToggle } from '../components/SoundToggle'
import { SpinWheel } from '../components/SpinWheel'
import { PODIUM_LANDED_MS, TopRatedPodium } from '../components/TopRatedPodium'
import { PointerReadout, WheelLegend } from '../components/WheelLegend'
import { fireConfetti, preloadConfetti } from '../lib/confetti'
import { PICK_METHODS, pickMethodInfo, RUNTIME_LIMITS, type RuntimeLimit } from '../lib/pickMethods'
import { loadSoundEnabled, saveSoundEnabled, unlockAudio } from '../lib/tick'
import { shortTitles } from '../lib/wheel'
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
  /** Top rated: the ranking, with the decision on #1 beside it. */
  | { kind: 'podium'; result: PickResult }
  /** Wheels: spinning until `landed`, then the winner shows next to the wheel. */
  | { kind: 'wheel'; result: PickResult; landed: boolean }

function parseMethod(value: string | null): PickMethod {
  return PICK_METHODS.find((m) => m.value === value)?.value ?? DEFAULT_METHOD
}

function parseMaxRuntime(value: string | null): RuntimeLimit | null {
  return RUNTIME_LIMITS.find((l) => String(l.value) === value)?.value ?? null
}

/**
 * Laptops/TVs: the wheel and podium stages break out of the page column to nearly the full window (max 100rem), so the
 * wheel and the winner can be sized for the couch. The negative margins are (column - target width) / 2.
 */
const STAGE_BREAKOUT_CLASS = 'lg:mx-[calc(50%-min(50vw-2rem,50rem))]'

/** The bigger buttons in the sticky "in the hat" bar. */
const barButtonClass =
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
  const [confirmedPickId, setConfirmedPickId] = useState<string | null>(null)
  const [sound, setSound] = useState(loadSoundEnabled)
  /** The wheel slice under the pointer, lit up in the list beside the wheel. */
  const [pointerIndex, setPointerIndex] = useState<number | null>(null)
  const stageRegion = useRef<HTMLDivElement>(null)

  // The button that started the pick is gone; move focus to the wheel (the podium and the winner card
  // focus the winner's title themselves).
  useEffect(() => {
    if (stage.kind === 'wheel') {
      stageRegion.current?.focus({ preventScroll: true })
    }
  }, [stage.kind])

  // Top rated: confetti once #1 has sprung onto the podium.
  const podiumPickId = stage.kind === 'podium' ? stage.result.pick_id : null
  useEffect(() => {
    if (podiumPickId === null) {
      return
    }
    const timer = window.setTimeout(fireConfetti, PODIUM_LANDED_MS)
    return () => window.clearTimeout(timer)
  }, [podiumPickId])

  const movies = useMemo(() => watchlist.data ?? [], [watchlist.data])
  const genres = useMemo(
    () => [...new Set(movies.flatMap((m) => m.genres))].sort((a, b) => a.localeCompare(b)),
    [movies],
  )
  const toRate = movies.filter((m) => m.awaiting_verdict)
  // Same rules as the backend's candidates, for a live count before asking it.
  const inTheHat = movies.filter(
    (m) =>
      m.is_pickable &&
      (maxRuntime === null || (m.runtime !== null && m.runtime <= maxRuntime)) &&
      (genre === null || m.genres.includes(genre)),
  ).length
  const pickableCount = movies.filter((m) => m.is_pickable).length
  // Everything on the watchlist is pickable or skipped tonight, so the rest are the skipped ones.
  const skipped = movies.filter((m) => !m.is_pickable)
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
    preloadConfetti()
    if (sound && pickMethodInfo(body.method).isWheel) {
      unlockAudio()
    }
    createPick.mutate(body, {
      onSuccess: (result) => {
        // The new wheel reports its own pointer once it starts; the old index may not exist on it.
        setPointerIndex(null)
        setStage(
          pickMethodInfo(result.method).isWheel ? { kind: 'wheel', result, landed: false } : { kind: 'podium', result },
        )
      },
      // The global toast explains it (e.g. nothing left to pick); start over.
      onError: () => setStage({ kind: 'choose' }),
    })
  }

  function onWheelDone(pickId: string) {
    setStage((s) => (s.kind === 'wheel' && s.result.pick_id === pickId ? { ...s, landed: true } : s))
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

  function bringAllBack() {
    for (const movie of skipped) {
      updateMovie.mutate({ id: movie.id, update: { skipped_tonight: false } })
    }
  }

  function toggleSound() {
    const next = !sound
    // The click is a user gesture, so audio may start (also when switched on mid-spin).
    if (next) {
      unlockAudio()
    }
    saveSoundEnabled(next)
    setSound(next)
  }

  const backToChoose = () => setStage({ kind: 'choose' })
  const busy = createPick.isPending || confirmPick.isPending || updateMovie.isPending

  let content: ReactNode
  if (watchlist.isPending) {
    content = (
      <div role="status" aria-label="Loading the watchlist" className="flex flex-col gap-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {PICK_METHODS.map((m) => (
            <Skeleton key={m.value} className="h-24 rounded-2xl sm:h-40" />
          ))}
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    )
  } else if (!watchlist.data) {
    // Only when there's nothing to show: a failed background refetch keeps the wheel or winner on screen.
    content = <ErrorState what="the watchlist" error={watchlist.error} onRetry={() => void watchlist.refetch()} />
  } else if (movies.length === 0) {
    content = (
      <EmptyState
        title="Nothing to pick from yet"
        icon={<PickIcon className="size-7" />}
        action={
          <Link to="/search" className={PRIMARY_BUTTON_CLASS}>
            <SearchIcon className="size-5" />
            Find a movie
          </Link>
        }
      >
        Save a few movies to the watchlist first, then come back and spin.
      </EmptyState>
    )
  } else if (stage.kind === 'choose' && pickableCount === 0) {
    content = (
      <EmptyState
        title="Everything is out for tonight"
        icon={<PickIcon className="size-7" />}
        action={
          <button type="button" className={PRIMARY_BUTTON_CLASS} onClick={bringAllBack} disabled={updateMovie.isPending}>
            Bring them all back
          </button>
        }
      >
        You said “not tonight” to every movie on the watchlist. They come back on their own tomorrow.
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

        {/* On phones the sticky bar gets a full-width backdrop, so chip rows scrolling under it can't peek out beside it. */}
        <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 -mx-4 -mt-6 bg-linear-to-t from-ink-950 from-70% to-transparent px-4 pt-6 pb-2 sm:mx-0 sm:mt-0 sm:bg-none sm:p-0 md:bottom-4">
          <div className="flex flex-col gap-3 rounded-2xl bg-ink-900/90 p-4 ring-1 ring-ink-700 backdrop-blur sm:flex-row sm:items-center">
            <p className="flex-1 text-sm text-muted" aria-live="polite">
              {inTheHat > 0 ? (
                <>
                  <span className="text-lg font-bold text-fg">{inTheHat}</span> {inTheHat === 1 ? 'movie' : 'movies'} in
                  the hat
                </>
              ) : (
                'No movie fits these filters.'
              )}
            </p>
            <div className="flex items-center gap-2">
              {isWheel && (
                <SoundToggle on={sound} onToggle={toggleSound} />
              )}
              {inTheHat === 0 && hasFilters ? (
                <button
                  type="button"
                  className={`${barButtonClass} flex-1`}
                  onClick={() => setParams(method === DEFAULT_METHOD ? {} : { method }, { replace: true })}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => runPick()}
                  disabled={inTheHat === 0 || createPick.isPending}
                  className={`${barButtonClass} flex-1 text-lg`}
                >
                  {createPick.isPending ? 'Picking…' : isWheel ? 'Spin the wheel' : 'Show the podium'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } else {
    const { result } = stage
    const confirmed = confirmedPickId === result.pick_id
    const spinAgain = () => runPick({ ...request(), method: result.method })
    const canSpinAgain = stage.kind === 'wheel' && stage.landed && !confirmed && !busy
    const pointerCandidate = pointerIndex === null ? undefined : result.candidates[pointerIndex]
    // Top rated only has something to redo when a coin flip settled a tie.
    const tied = result.candidates.filter((c) => c.probability > 0).length > 1
    let againLabel: string | undefined
    if (stage.kind === 'wheel') {
      againLabel = createPick.isPending ? 'Spinning…' : 'Spin again'
    } else if (tied) {
      againLabel = createPick.isPending ? 'Flipping…' : 'Flip again'
    }
    const actions = (
      <PickActions
        movieId={result.winner.id}
        confirmed={confirmed}
        confirming={confirmPick.isPending}
        onConfirm={() => onConfirm(result)}
        againLabel={againLabel}
        onAgain={spinAgain}
        onPickSomethingElse={backToChoose}
        onNotTonight={() => onNotTonight(result)}
        busy={busy}
      />
    )

    // Stage mode: the page header shrinks to this row, so the pick itself gets the screen.
    content = (
      <div
        ref={stageRegion}
        tabIndex={-1}
        role="region"
        aria-label={pickMethodInfo(result.method).label}
        className={`flex flex-col gap-6 outline-none ${STAGE_BREAKOUT_CLASS}`}
      >
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={backToChoose}
            className="-my-2 inline-flex items-center gap-1.5 rounded-lg py-2 text-sm font-medium text-muted transition hover:text-fg lg:text-lg"
          >
            <ArrowLeftIcon className="size-4 lg:size-5" />
            Change how we pick
          </button>
          <p className="font-display text-lg font-semibold text-muted lg:text-2xl">{pickMethodInfo(result.method).label}</p>
        </div>

        {stage.kind === 'podium' && (
          <TopRatedPodium key={result.pick_id} candidates={result.candidates} winner={result.winner} actions={actions} />
        )}

        {stage.kind === 'wheel' && (
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:items-start">
            {/* min-w-0: the readout's one-line title mustn't widen the grid column past the screen. */}
            <div className="flex min-w-0 flex-col items-center gap-3">
              <SpinWheel
                candidates={result.candidates}
                winnerId={result.winner.id}
                spinKey={result.pick_id}
                showPercent={result.method === 'wheel_weighted'}
                sound={sound}
                onDone={() => onWheelDone(result.pick_id)}
                onSpinAgain={canSpinAgain ? spinAgain : undefined}
                onPointerChange={setPointerIndex}
              />
              <div className="flex w-full max-w-md items-center justify-center gap-3 lg:max-w-none">
                {/* Below lg the winner scrolls into view under the wheel and has its own "Spin again". */}
                {canSpinAgain && <p className="hidden text-muted lg:block lg:text-lg">Tap the wheel to spin again</p>}
                {!stage.landed && pointerCandidate && (
                  <PointerReadout
                    candidate={pointerCandidate}
                    title={shortTitles(result.candidates.map((c) => c.movie.title))[pointerIndex ?? 0]}
                    method={result.method}
                    className="flex-1 lg:hidden"
                  />
                )}
                <SoundToggle on={sound} onToggle={toggleSound} className="size-9 shrink-0 lg:size-11" />
              </div>
            </div>
            {/* While it spins: who's on the wheel. Once it lands: the winner. */}
            {stage.landed ? (
              <PickWinner key={result.pick_id} movie={result.winner} method={result.method} actions={actions} />
            ) : (
              <WheelLegend candidates={result.candidates} method={result.method} activeIndex={pointerIndex} />
            )}
          </div>
        )}
      </div>
    )
  }

  const stageMode = stage.kind !== 'choose' && watchlist.data !== undefined && movies.length > 0
  return (
    <>
      {stageMode ? (
        // The page title stays for screen readers and as the focus fallback.
        <h1 className="sr-only">What are we watching?</h1>
      ) : (
        <PageHeader title="What are we watching?" subtitle="Go with the top rated, or let the wheel decide." />
      )}
      {content}
    </>
  )
}

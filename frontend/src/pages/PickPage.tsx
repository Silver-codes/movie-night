import { useReducedMotion } from 'motion/react'
import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useCancelPick, useMovies, useUpdateMovie } from '../api/movieHooks'
import { useConfirmPick, useCreatePick } from '../api/pickHooks'
import type { Movie, MovieFilters, PickMethod, PickRequest, PickResult } from '../api/types'
import { PRIMARY_BUTTON_CLASS, primaryButtonClass } from '../components/buttonStyles'
import { EmptyState } from '../components/EmptyState'
import { DIMMED_CLASS, LIGHTS_DOWN_CLASS } from '../components/lightsDown'
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
import { fireConfetti, preloadConfetti, stopConfetti } from '../lib/confetti'
import { PICK_METHODS, pickMethodInfo, RUNTIME_LIMITS, type RuntimeLimit } from '../lib/pickMethods'
import { loadSoundEnabled, playChime, saveSoundEnabled, unlockAudio } from '../lib/tick'
import { shortTitles } from '../lib/wheel'
import { dismissToast, toast, useToastsAtBottomOnPhones } from '../lib/toast'

const ALL_WATCHLIST: MovieFilters = { status: 'watchlist' }
const DEFAULT_METHOD: PickMethod = 'wheel_weighted'
/** After "Not tonight", the winner stays on screen this long with an Undo before the next pick starts. */
const RESPIN_DELAY_MS = 1500
/** How many titles the "Out tonight" line names before it counts the rest. */
const OUT_TONIGHT_NAMED = 2

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

function dismissOutTonightToast(ref: RefObject<number | null>) {
  if (ref.current !== null) {
    dismissToast(ref.current)
    ref.current = null
  }
}

export function PickPage() {
  const [params, setParams] = useSearchParams()
  const method = parseMethod(params.get('method'))
  const maxRuntime = parseMaxRuntime(params.get('max'))
  const genre = params.get('genre')

  const watchlist = useMovies(ALL_WATCHLIST)
  const createPick = useCreatePick()
  const confirmPick = useConfirmPick()
  const updateMovie = useUpdateMovie()
  const cancelPick = useCancelPick()

  const [stage, setStage] = useState<Stage>({ kind: 'choose' })
  /** The confirmed pick and the movie it saved (on Top Rated, maybe not #1): "Pick something else" takes it back. */
  const [confirmedPick, setConfirmedPick] = useState<{ pickId: string; movie: Movie } | null>(null)
  /** Top Rated: the place they tapped instead of #1 (null = the server's winner). */
  const [chosenId, setChosenId] = useState<number | null>(null)
  const [sound, setSound] = useState(loadSoundEnabled)
  /** The wheel slice under the pointer, lit up in the list beside the wheel. */
  const [pointerIndex, setPointerIndex] = useState<number | null>(null)
  const stageRegion = useRef<HTMLDivElement>(null)
  /** The pick whose winner was just put on "not tonight", while its Undo is on screen before the next pick. */
  const [leavingPickId, setLeavingPickId] = useState<string | null>(null)
  const leaving = useRef<{ timer: number; winner: Movie } | null>(null)
  const mounted = useRef(true)
  /** The "… is out for tonight · Undo" toast; it goes once the next pick has landed, so toasts don't pile up. */
  const outTonightToast = useRef<number | null>(null)
  // The unmount cleanup below needs this render's announceOutTonight (it closes over updateMovie).
  const announceOnLeave = useRef<(movie: Movie) => void>(() => {})
  useEffect(() => {
    announceOnLeave.current = announceOutTonight
  })

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      // Left the page during the inline Undo: the toast takes it over.
      if (leaving.current) {
        window.clearTimeout(leaving.current.timer)
        announceOnLeave.current(leaving.current.winner)
        leaving.current = null
      }
    }
  }, [])

  // The button that started the spin ("Spin the wheel", "Spin again") is gone; move focus to the wheel stage, where
  // Space skips the spin (the podium and the winner card focus the winner's title themselves).
  const spinningPickId = stage.kind === 'wheel' && !stage.landed ? stage.result.pick_id : null
  useEffect(() => {
    if (spinningPickId !== null && (document.activeElement === document.body || document.activeElement === null)) {
      stageRegion.current?.focus({ preventScroll: true })
    }
  }, [spinningPickId])

  // Below lg the winner card sits under the wheel (or podium), so a pick started from it ("Spin again", "Not
  // tonight") would play off-screen: bring the stage's top back into view first. Laptops/TVs see the whole stage.
  const stagePickId = stage.kind === 'choose' ? null : stage.result.pick_id
  const reduceMotion = useReducedMotion()
  useEffect(() => {
    const region = stageRegion.current
    if (stagePickId === null || !region || window.matchMedia('(min-width: 64rem)').matches) {
      return
    }
    // The scroll margin clears the sticky top bar, so "off-screen" includes "under the bar".
    if (region.getBoundingClientRect().top < parseFloat(getComputedStyle(region).scrollMarginTop)) {
      region.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }
  }, [stagePickId, reduceMotion])

  // Back to choosing (or off the page): confetti still falling from the last pick goes with it.
  const choosing = stage.kind === 'choose'
  useEffect(() => {
    if (choosing) {
      stopConfetti()
    }
  }, [choosing])
  useEffect(() => stopConfetti, [])

  // Top rated: confetti once #1 has sprung onto the podium.
  const podiumPickId = stage.kind === 'podium' ? stage.result.pick_id : null
  useEffect(() => {
    if (podiumPickId === null) {
      return
    }
    const timer = window.setTimeout(() => {
      fireConfetti()
      dismissOutTonightToast(outTonightToast)
    }, PODIUM_LANDED_MS)
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
  const shortTitleOf = useMemo(() => {
    const short = shortTitles(movies.map((m) => m.title))
    return new Map(movies.map((m, i) => [m.id, short[i]]))
  }, [movies])
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
        setChosenId(null)
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
    dismissOutTonightToast(outTonightToast)
  }

  /** `movie` is the winner, or on Top Rated the place they chose instead. */
  // No toast: the winner card itself turns into the news ("Lights down…", a live status), and the stage dims around it.
  function onConfirm(result: PickResult, movie: Movie) {
    const movieId = movie.id === result.winner.id ? undefined : movie.id
    // The theatre chime only where the sound toggle is on screen (the wheels); the click allows audio to start.
    const chime = sound && pickMethodInfo(result.method).isWheel
    if (chime) {
      unlockAudio()
    }
    confirmPick.mutate(
      { pickId: result.pick_id, movieId },
      {
        onSuccess: () => {
          setConfirmedPick({ pickId: result.pick_id, movie })
          if (chime) {
            playChime()
          }
        },
      },
    )
  }

  // mutateAsync, not per-call callbacks: those are skipped once the page unmounts, and the toast's Undo
  // can be pressed from any page. Failures already show the global error toast.
  function bringBack(movie: Movie) {
    updateMovie
      .mutateAsync({ id: movie.id, update: { skipped_tonight: false } })
      .then(() => toast.success(`${movie.title} is back in the hat`))
      .catch(() => {})
  }

  /**
   * The Undo moves to a toast once the inline one is gone (the next pick started, or they left the stage). It stays
   * until that pick lands; after that, the "Out tonight" line on the choose stage brings it back.
   */
  function announceOutTonight(movie: Movie) {
    outTonightToast.current = toast.info(`${movie.title} is out for tonight`, {
      action: { label: 'Undo', onClick: () => bringBack(movie) },
    })
  }

  /** Ends the inline-Undo moment: `announce` hands the Undo to a toast, otherwise the movie was just brought back. */
  function endLeaving({ announce }: { announce: boolean }) {
    if (!leaving.current) {
      return
    }
    window.clearTimeout(leaving.current.timer)
    if (announce) {
      announceOutTonight(leaving.current.winner)
    }
    leaving.current = null
    setLeavingPickId(null)
  }

  /** `winner` is the movie on the card: the server's winner, or the place they chose on Top Rated. */
  function onNotTonight(result: PickResult, winner: Movie) {
    updateMovie
      .mutateAsync({ id: winner.id, update: { skipped_tonight: true } })
      .then(() => {
        if (!mounted.current) {
          announceOutTonight(winner)
          return
        }
        // The winner stays on screen for a moment with an inline Undo, then the next pick starts.
        setLeavingPickId(result.pick_id)
        const timer = window.setTimeout(() => {
          endLeaving({ announce: true })
          runPick({ method: result.method, max_runtime: maxRuntime ?? undefined, genre: genre ?? undefined })
        }, RESPIN_DELAY_MS)
        leaving.current = { timer, winner }
      })
      .catch(() => {})
  }

  /** Inline Undo: the same movie stays, as if "Not tonight" never happened. */
  function undoNotTonight(movie: Movie) {
    endLeaving({ announce: false })
    bringBack(movie)
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

  const backToChoose = () => {
    // The movie stays out (that's what they asked for), and no new pick starts.
    endLeaving({ announce: true })
    setStage({ kind: 'choose' })
  }

  /** After "We're watching this!": they changed their minds, so the confirmation goes and they start over. */
  function pickSomethingElse() {
    if (!confirmedPick) {
      backToChoose()
      return
    }
    const { movie } = confirmedPick
    // A failure keeps the stage (the global toast says why), so the confirmation they see is still the real one.
    cancelPick.mutate(movie.id, {
      onSuccess: () => {
        setConfirmedPick(null)
        toast.info(`${movie.title} isn't tonight's pick anymore`)
        setStage({ kind: 'choose' })
      },
    })
  }
  const busy =
    createPick.isPending ||
    confirmPick.isPending ||
    cancelPick.isPending ||
    updateMovie.isPending ||
    leavingPickId !== null

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
      // Phones: tighter sections, so the filters sit above the sticky "in the hat" bar on the first screen.
      <div className="flex flex-col gap-6 sm:gap-8">
        {toRate.length > 0 && (
          <section aria-label="Waiting for your verdict" className="flex flex-col gap-2">
            {toRate.map((movie) => (
              <RateReminder key={movie.id} movie={movie} />
            ))}
          </section>
        )}

        <div className="flex flex-col gap-3">
          <div role="radiogroup" aria-label="How to pick" className="grid grid-cols-3 gap-2 sm:gap-3">
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
          {/* Phones: the tiles only name the methods; the chosen one explains itself here (the radio already says it). */}
          <p aria-hidden="true" className="text-sm text-muted sm:hidden">
            {pickMethodInfo(method).tagline}
          </p>
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
            {/* Phones: "· 1 out · Bring back" joins the count's line (and wraps if it must), so the bar stays two rows. */}
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1.5 sm:flex-col sm:items-start sm:gap-0.5">
              <p className="text-sm text-muted" aria-live="polite">
                {inTheHat > 0 ? (
                  <>
                    <span className="text-lg font-bold text-fg">{inTheHat}</span> {inTheHat === 1 ? 'movie' : 'movies'}{' '}
                    in the hat
                  </>
                ) : (
                  'No movie fits these filters.'
                )}
              </p>
              {skipped.length > 0 && (
                <OutTonight
                  titles={skipped.map((m) => shortTitleOf.get(m.id) ?? m.title)}
                  onBringBack={bringAllBack}
                  disabled={updateMovie.isPending}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              {isWheel && (
                <SoundToggle on={sound} onToggle={toggleSound} />
              )}
              {inTheHat === 0 && hasFilters ? (
                <button
                  type="button"
                  className={`${primaryButtonClass('bar')} flex-1`}
                  onClick={() => setParams(method === DEFAULT_METHOD ? {} : { method }, { replace: true })}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => runPick()}
                  disabled={inTheHat === 0 || createPick.isPending}
                  className={`${primaryButtonClass('bar')} flex-1 text-lg`}
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
    const confirmed = confirmedPick?.pickId === result.pick_id
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
    // The movie on the card: the server's winner, or on Top Rated the place they tapped. Every action follows it.
    const chosen =
      (stage.kind === 'podium' && chosenId !== null
        ? result.candidates.find((c) => c.movie.id === chosenId)?.movie
        : undefined) ?? result.winner
    const actions = (
      <PickActions
        movieId={chosen.id}
        confirmed={confirmed}
        confirming={confirmPick.isPending}
        onConfirm={() => onConfirm(result, chosen)}
        againLabel={againLabel}
        onAgain={spinAgain}
        onPickSomethingElse={pickSomethingElse}
        cancelling={cancelPick.isPending}
        onNotTonight={() => onNotTonight(result, chosen)}
        onUndoNotTonight={leavingPickId === result.pick_id ? () => undoNotTonight(chosen) : undefined}
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
        className={`flex scroll-mt-[calc(5rem+env(safe-area-inset-top))] flex-col gap-6 outline-none ${STAGE_BREAKOUT_CLASS}`}
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
          <TopRatedPodium
            key={result.pick_id}
            candidates={result.candidates}
            winner={result.winner}
            selectedId={chosen.id}
            onSelect={setChosenId}
            // Settled once confirmed, and held while "Not tonight" is on its way out.
            locked={confirmed || busy}
            decided={confirmed}
            actions={actions}
          />
        )}

        {stage.kind === 'wheel' && (
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:items-start">
            {/* min-w-0: the readout's one-line title mustn't widen the grid column past the screen. */}
            <div className={`flex min-w-0 flex-col items-center gap-3 ${LIGHTS_DOWN_CLASS} ${confirmed ? DIMMED_CLASS : ''}`}>
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
                {!stage.landed && <p className="hidden text-muted lg:block lg:text-lg">Tap the wheel to skip</p>}
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
              {/* Phones: the readout has the row, so the skip hint sits under it. */}
              {!stage.landed && <p className="-mt-1 text-sm text-muted lg:hidden">Tap the wheel to skip</p>}
            </div>
            {/* While it spins: who's on the wheel. Once it lands: the winner. */}
            {stage.landed ? (
              <PickWinner key={result.pick_id} movie={result.winner} actions={actions} spotlight={confirmed} />
            ) : (
              <WheelLegend candidates={result.candidates} method={result.method} activeIndex={pointerIndex} />
            )}
          </div>
        )}
      </div>
    )
  }

  const stageMode = stage.kind !== 'choose' && watchlist.data !== undefined && movies.length > 0
  // Phones: the top of the stage is the wheel's pointer, so toasts ("… is out for tonight · Undo") go to the bottom.
  useToastsAtBottomOnPhones(stageMode)
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

/** Under the hat count: which movies "Not tonight" took out, so a slip is visible and one tap undoes it. */
function OutTonight({
  titles,
  onBringBack,
  disabled,
}: {
  titles: string[]
  onBringBack: () => void
  disabled: boolean
}) {
  const named = titles.slice(0, OUT_TONIGHT_NAMED).join(', ')
  const more = titles.length - OUT_TONIGHT_NAMED
  return (
    <p className="text-sm text-muted">
      {/* Phones: just how many; the names need the room of a wider bar. */}
      <span className="sm:hidden">
        <span aria-hidden="true">· </span>
        {titles.length} out<span className="sr-only"> tonight</span>
      </span>
      <span className="hidden sm:inline">
        Out tonight: <span className="text-fg/85">{named}</span>
        {more > 0 && ` +${more}`}
      </span>
      <span aria-hidden="true"> · </span>
      <button
        type="button"
        onClick={onBringBack}
        disabled={disabled}
        className="-my-1 rounded py-1 font-semibold text-fg underline-offset-4 transition hover:underline disabled:opacity-60"
      >
        <span className="sm:hidden">Bring back</span>
        <span className="hidden sm:inline">{titles.length === 1 ? 'Bring it back' : 'Bring them back'}</span>
      </button>
    </p>
  )
}

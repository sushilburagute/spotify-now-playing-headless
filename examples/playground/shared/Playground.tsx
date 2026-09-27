'use client'

import { useCallback, useState } from 'react'
import type {
  NowPlayingResponse,
  TopArtistsResponse,
  TopTracksResponse,
} from 'spotify-now-playing-headless/core'
import {
  useNowPlaying,
  useTopArtists,
  useTopTracks,
  type SpotifyFetcherOptions,
} from 'spotify-now-playing-headless/react'
import { nowPlaying, pausedPlaying, topArtists, topTracks } from './fixtures'

type Framework = 'react' | 'next'
type Scenario = 'playing' | 'paused' | 'loading' | 'error'
type View = 'pulse' | 'poster' | 'quiet'

const scenarios: { id: Scenario; label: string }[] = [
  { id: 'playing', label: 'Playing' },
  { id: 'paused', label: 'Paused' },
  { id: 'loading', label: 'Loading' },
  { id: 'error', label: 'Error' },
]

const views: { id: View; label: string; description: string }[] = [
  { id: 'pulse', label: 'Pulse', description: 'Immersive player' },
  { id: 'poster', label: 'Poster', description: 'Editorial feature' },
  { id: 'quiet', label: 'Quiet', description: 'Compact widget' },
]

const reactCode = `import { useNowPlaying } from 'spotify-now-playing-headless/react'

function NowPlaying() {
  const { data, error, isLoading } = useNowPlaying({
    endpoint: '/api/now-playing',
  })

  if (isLoading) return <p>Loading...</p>
  if (error) return <p>{error.message}</p>
  return <p>{data?.title ?? 'Nothing playing'}</p>
}`

const nextCode = `// app/api/now-playing/route.ts
import { createNowPlayingRoute } from 'spotify-now-playing-headless/nextjs'

export const GET = createNowPlayingRoute({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
  onRefreshToken: persistRefreshToken, // implement server-side storage
})

// Then call useNowPlaying({ endpoint: '/api/now-playing' })
// from a Client Component.`

function sleep(duration: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, duration)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function pendingUntilAbort<T>(signal?: AbortSignal): Promise<T> {
  return new Promise((_resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    signal?.addEventListener(
      'abort',
      () => reject(new DOMException('Aborted', 'AbortError')),
      { once: true }
    )
  })
}

function useMockFetcher<T>(fixture: T, scenario: Scenario) {
  return useCallback(
    async (_url: string, options?: SpotifyFetcherOptions): Promise<T> => {
      if (scenario === 'loading') return pendingUntilAbort<T>(options?.signal)
      await sleep(560, options?.signal)
      if (scenario === 'error')
        throw new Error('Simulated network error. Try another state.')
      return fixture
    },
    [fixture, scenario]
  )
}

function Equalizer({ active = false }: { active?: boolean }) {
  return (
    <span
      className={`equalizer${active ? ' equalizer--active' : ''}`}
      aria-hidden="true"
    >
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

function Player({
  data,
  state,
  view,
  isLoading,
  error,
}: {
  data: NowPlayingResponse | undefined
  state: Scenario
  view: View
  isLoading: boolean
  error: Error | undefined
}) {
  const busy = state === 'loading' || (isLoading && !data && !error)
  const failed = state === 'error' && !!error

  return (
    <div
      className={`player player--${view}`}
      aria-live="polite"
      aria-busy={busy}
    >
      <div className="player-noise" aria-hidden="true" />
      <div className="player-topline">
        <span className="tiny-label">YOUR SOUNDTRACK / 001</span>
        <span className="player-state">
          <Equalizer active={!busy && !failed && !!data?.isPlaying} />{' '}
          {busy
            ? 'CONNECTING'
            : failed
              ? 'OFFLINE'
              : data?.isPlaying
                ? 'NOW PLAYING'
                : 'PAUSED'}
        </span>
      </div>

      {busy ? (
        <div className="player-content player-content--message">
          <span
            className="message-orb message-orb--loading"
            aria-hidden="true"
          />
          <div>
            <span className="tiny-label">FETCHING THE FREQUENCY</span>
            <h3>Finding the next note...</h3>
            <p>This is the hook’s loading state.</p>
          </div>
        </div>
      ) : failed ? (
        <div className="player-content player-content--message">
          <span className="message-orb message-orb--error" aria-hidden="true">
            !
          </span>
          <div>
            <span className="tiny-label">SIGNAL LOST</span>
            <h3>We hit a quiet patch.</h3>
            <p>{error.message}</p>
          </div>
        </div>
      ) : data ? (
        <div className="player-content" key={`${view}-${data.isPlaying}`}>
          <div className="album-wrap">
            <img
              className="album-art"
              src={data.albumImageUrl}
              alt={`Abstract cover for ${data.album}`}
            />
            <span className="album-glow" aria-hidden="true" />
          </div>
          <div className="player-details">
            <span className="player-overline">
              A LITTLE SOMETHING FOR YOUR EARS
            </span>
            <h3>{data.title}</h3>
            <p>
              {data.artist} <span>·</span> {data.album}
            </p>
            <div className="player-divider" />
            <div className="player-bottom">
              <span className="player-play-icon" aria-hidden="true">
                {data.isPlaying ? 'Ⅱ' : '▶'}
              </span>
              <span className="progress-track">
                <span className={data.isPlaying ? 'progress-active' : ''} />
              </span>
              <span className="tiny-label">03:42</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="player-content player-content--message">
          <p>Ready when you are.</p>
        </div>
      )}
      <div className="player-watermark" aria-hidden="true">
        SOUND / 01
      </div>
    </div>
  )
}

function DataPanels({
  tracks,
  artists,
  state,
  error,
}: {
  tracks: TopTracksResponse | undefined
  artists: TopArtistsResponse | undefined
  state: Scenario
  error: Error | undefined
}) {
  const showPlaceholder = state === 'loading' || (state === 'error' && !!error)

  return (
    <div className="data-grid">
      <section className="data-panel">
        <div className="data-panel-heading">
          <div>
            <span className="section-kicker">THE REPEAT LIST</span>
            <h3>Top tracks</h3>
          </div>
          <span className="panel-number">01 / 02</span>
        </div>
        {showPlaceholder ? (
          <div className="panel-placeholder">
            {state === 'loading'
              ? 'Loading favorite tracks…'
              : 'Tracks unavailable in this state.'}
          </div>
        ) : (
          <ol className="track-list">
            {tracks?.tracks.map((track, index) => (
              <li key={track.title}>
                <span className="list-index">0{index + 1}</span>
                <img src={track.albumArt.url} alt="" />
                <div>
                  <strong>{track.title}</strong>
                  <span>{track.artist}</span>
                </div>
                <span className="track-arrow" aria-hidden="true">
                  ↗
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
      <section className="data-panel">
        <div className="data-panel-heading">
          <div>
            <span className="section-kicker">IN GOOD COMPANY</span>
            <h3>Top artists</h3>
          </div>
          <span className="panel-number">02 / 02</span>
        </div>
        {showPlaceholder ? (
          <div className="panel-placeholder">
            {state === 'loading'
              ? 'Loading favorite artists…'
              : 'Artists unavailable in this state.'}
          </div>
        ) : (
          <ol className="artist-list">
            {artists?.artists.map((artist, index) => (
              <li key={artist.name}>
                <span className="list-index">0{index + 1}</span>
                {artist.image && <img src={artist.image.url} alt="" />}
                <div>
                  <strong>{artist.name}</strong>
                  <span>{artist.genres?.[0]}</span>
                </div>
                <span className="artist-mark" aria-hidden="true">
                  ✳
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export function Playground({ framework }: { framework: Framework }) {
  const [scenario, setScenario] = useState<Scenario>('playing')
  const [view, setView] = useState<View>('pulse')
  const [promptStatus, setPromptStatus] = useState('')
  const currentFixture = scenario === 'paused' ? pausedPlaying : nowPlaying
  const current = useNowPlaying({
    endpoint: '/api/now-playing',
    fetcher: useMockFetcher(currentFixture, scenario),
  })
  const tracks = useTopTracks({
    endpoint: '/api/top-tracks',
    fetcher: useMockFetcher(topTracks, scenario),
  })
  const artists = useTopArtists({
    endpoint: '/api/top-artists',
    fetcher: useMockFetcher(topArtists, scenario),
  })

  const refresh = () => {
    void Promise.all([current.mutate(), tracks.mutate(), artists.mutate()])
  }

  const copyPrompt = async () => {
    try {
      const response = await fetch('/prompt.txt')
      if (!response.ok) throw new Error('Prompt unavailable')
      await navigator.clipboard.writeText(await response.text())
      setPromptStatus('Copied to clipboard')
    } catch {
      setPromptStatus('Open the prompt file to copy it')
    }
  }

  return (
    <main className="site-shell playground-shell">
      <div className="ambient ambient--playground" aria-hidden="true" />
      <header className="site-header playground-header">
        <a
          className="brand"
          href="/"
          aria-label="Spotify Now Playing playground home"
        >
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            nowplaying<span className="brand-dot">.</span>
          </span>
        </a>
        <nav className="framework-switch" aria-label="Framework preview">
          <a
            href="/react/"
            aria-current={framework === 'react' ? 'page' : undefined}
          >
            React
          </a>
          <a
            href="/next/"
            aria-current={framework === 'next' ? 'page' : undefined}
          >
            Next.js
          </a>
        </nav>
        <a
          className="header-link"
          href="https://github.com/sushilburagute/spotify-now-playing-headless/tree/main/examples/playground"
          target="_blank"
          rel="noreferrer"
        >
          Source <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div className="playground-body">
        <div className="playground-intro reveal">
          <div className="eyebrow">
            <span className="eyebrow-line" /> THE INTERACTIVE PLAYGROUND
          </div>
          <div className="playground-intro-row">
            <h1>
              One API.
              <br />
              <span>Infinite looks.</span>
            </h1>
            <p>
              The data stays the same. The interface is yours to imagine. Change
              the scene and watch the hooks respond.
            </p>
          </div>
          <div className="mock-banner">
            <span className="mock-beacon" /> LIVE INTERFACE / FICTIONAL DATA{' '}
            <span>NO SPOTIFY ACCOUNT REQUIRED</span>
          </div>
        </div>

        <section className="workspace" aria-label="Interactive music preview">
          <div className="workspace-toolbar">
            <div className="control-group">
              <span className="control-label">01 / STATE</span>
              <div
                className="segmented"
                role="group"
                aria-label="Mock response state"
              >
                {scenarios.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={scenario === item.id}
                    onClick={() => setScenario(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="refresh-button"
              type="button"
              onClick={refresh}
              aria-label="Refresh mock data"
            >
              <span aria-hidden="true">↻</span> Refresh
            </button>
          </div>
          <div className="view-picker">
            <span className="control-label">02 / CHANGE THE LOOK</span>
            <div
              className="view-options"
              role="group"
              aria-label="Player appearance"
            >
              {views.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={view === item.id ? 'active' : ''}
                  aria-pressed={view === item.id}
                  onClick={() => setView(item.id)}
                >
                  <span className="view-dot" />
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </div>
          <Player
            data={current.data}
            state={scenario}
            view={view}
            isLoading={current.isLoading}
            error={current.error}
          />
          <div className="preview-caption">
            <span>FIG. 01 — A HEADLESS HOOK, THREE DIFFERENT MOODS.</span>
            <span>
              BUILT WITH {framework === 'react' ? 'REACT + VITE' : 'NEXT.JS'}
            </span>
          </div>
        </section>

        <section className="collections-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">BEYOND WHAT’S PLAYING</span>
              <h2>There’s more to the story.</h2>
            </div>
            <p>
              Top tracks and artists use the same simple pattern: request data,
              then make the presentation your own.
            </p>
          </div>
          <DataPanels
            tracks={tracks.data}
            artists={artists.data}
            state={scenario}
            error={tracks.error ?? artists.error}
          />
        </section>

        <section className="docs-section" id="how-it-works">
          <div className="docs-copy">
            <span className="section-kicker">UNDER THE HOOD</span>
            <h2>
              Start with data.
              <br />
              <em>End anywhere.</em>
            </h2>
            <p>
              This preview calls the package’s real React hooks with a mock
              fetcher. In your app, point the hooks at your own server endpoint.
              Keep Spotify credentials on the server and persist rotated refresh
              tokens.
            </p>
            <div className="docs-links">
              <a
                href="https://github.com/sushilburagute/spotify-now-playing-headless#readme"
                target="_blank"
                rel="noreferrer"
              >
                Read the guide ↗
              </a>
              <a
                href="https://www.npmjs.com/package/spotify-now-playing-headless"
                target="_blank"
                rel="noreferrer"
              >
                View on npm ↗
              </a>
            </div>
          </div>
          <div className="code-card">
            <div className="code-card-top">
              <span className="code-dots">
                <i />
                <i />
                <i />
              </span>
              <span>
                {framework === 'react'
                  ? 'NowPlaying.tsx'
                  : 'app/api/now-playing/route.ts'}
              </span>
              <span>{framework === 'react' ? 'TSX' : 'TS'}</span>
            </div>
            <pre>
              <code>{framework === 'react' ? reactCode : nextCode}</code>
            </pre>
          </div>
        </section>

        <section className="agent-section" aria-labelledby="agent-title">
          <div>
            <span className="section-kicker">TAKE IT INTO YOUR APP</span>
            <h2 id="agent-title">A head start for you and your agent.</h2>
            <p>
              Give your coding agent a focused implementation prompt, then fill
              in your framework, UI, and secret storage. The agent guide
              explains the package’s entry points and secure server setup.
            </p>
            <div className="agent-actions">
              <button
                type="button"
                className="primary-button"
                onClick={() => void copyPrompt()}
              >
                Copy starter prompt <span aria-hidden="true">↗</span>
              </button>
              <a href="/agent-guide.md">Read the agent guide ↗</a>
              <a href="/prompt.txt">View prompt text ↗</a>
            </div>
            <p className="prompt-status" role="status" aria-live="polite">
              {promptStatus}
            </p>
          </div>
          <div className="agent-preview" aria-label="Prompt excerpt">
            <span className="tiny-label">
              YOUR NEXT STEP / COPY + CUSTOMIZE
            </span>
            <p>
              “I want to add Spotify Now Playing, Top Tracks, and Top Artists to
              my app using spotify-now-playing-headless...”
            </p>
            <span>FRAMEWORK · UI · SECRET STORAGE · VERIFICATION</span>
          </div>
        </section>

        <footer className="site-footer">
          <a className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>
              nowplaying<span className="brand-dot">.</span>
            </span>
          </a>
          <span>
            Made by{' '}
            <a href="https://sush.dev/" target="_blank" rel="noreferrer">
              Sushil Buragute
            </a>{' '}
            ·{' '}
            <a
              href="https://github.com/sushilburagute"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>{' '}
            · Fictional music, real hooks.
          </span>
          <a
            href="#top"
            onClick={(event) => {
              event.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            Back to top ↑
          </a>
        </footer>
      </div>
    </main>
  )
}

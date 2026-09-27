'use client'

import { useNowPlaying } from 'spotify-now-playing-headless/react'

export default function Home() {
  const { data, error, isLoading, mutate } = useNowPlaying({
    endpoint: '/api/now-playing',
    refreshInterval: 30_000,
  })
  const playing = !!data?.isPlaying
  const status = error
    ? 'Connection issue'
    : isLoading && !data
      ? 'Connecting to Spotify'
      : playing
        ? 'Now playing'
        : 'Nothing playing'

  return (
    <main className="example-shell">
      <header className="example-header">
        <a className="example-brand" href="https://spotify-headless.sush.dev/">
          <span className="example-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span className="example-brand-word">
            nowplaying<span>.</span>
          </span>
        </a>
        <span className="example-framework">
          NEXT.JS APP ROUTER / LIVE INTEGRATION
        </span>
      </header>

      <div className="example-layout">
        <section className="example-intro">
          <p className="example-kicker">HEADLESS SPOTIFY / EXAMPLE 02</p>
          <h1>
            Your music.
            <br />
            <em>Your canvas.</em>
          </h1>
          <p className="example-description">
            A small real-data example of the React hook and a Next.js Route
            Handler. Spotify credentials stay on the server.
          </p>
          <a
            className="example-link"
            href="https://spotify-headless.sush.dev/next/"
          >
            Explore all six looks <span aria-hidden="true">↗</span>
          </a>
        </section>

        <section
          className="example-player"
          aria-label="Spotify now playing"
          aria-live="polite"
          aria-busy={isLoading && !data}
        >
          <div className="example-player-top">
            <span>
              <i className={playing ? 'live' : ''} /> {status}
            </span>
            <button
              type="button"
              onClick={() => void mutate()}
              disabled={isLoading}
            >
              <span aria-hidden="true">↻</span> Refresh
            </button>
          </div>
          <div className="example-cover">
            {playing ? (
              <img
                src={data.albumImageUrl}
                alt={`Cover art for ${data.album}`}
              />
            ) : (
              <span className="example-cover-placeholder" aria-hidden="true">
                ♫
              </span>
            )}
          </div>
          <div className="example-player-bottom">
            <div>
              <span className="example-kicker">CURRENT FREQUENCY</span>
              <h2>{playing ? data.title : status}</h2>
              <p>
                {playing
                  ? `${data.artist} · ${data.album}`
                  : (error?.message ??
                    'Press play in Spotify to see your track here.')}
              </p>
            </div>
            {playing && (
              <a href={data.songUrl} target="_blank" rel="noreferrer">
                Open track ↗
              </a>
            )}
          </div>
        </section>
      </div>

      <footer className="example-footer">
        <span>Built with spotify-now-playing-headless</span>
        <a href="https://sush.dev/">Made by Sushil Buragute ↗</a>
      </footer>
    </main>
  )
}

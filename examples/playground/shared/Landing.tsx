const repository =
  'https://github.com/sushilburagute/spotify-now-playing-headless'

export function Landing() {
  return (
    <main className="site-shell landing-shell">
      <div className="ambient ambient--one" aria-hidden="true" />
      <div className="ambient ambient--two" aria-hidden="true" />

      <header className="site-header reveal" style={{ animationDelay: '50ms' }}>
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
        <nav className="header-links" aria-label="Creator links">
          <a
            className="header-link"
            href="https://sush.dev/"
            data-analytics-event="resource_open"
            data-analytics-resource="portfolio"
            target="_blank"
            rel="noreferrer"
          >
            Portfolio <span aria-hidden="true">↗</span>
          </a>
          <a
            className="header-link"
            href="https://github.com/sushilburagute"
            data-analytics-event="resource_open"
            data-analytics-resource="github_profile"
            target="_blank"
            rel="noreferrer"
          >
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <div className="landing-grid">
        <section className="landing-copy">
          <div className="eyebrow reveal" style={{ animationDelay: '140ms' }}>
            <span className="eyebrow-line" /> OPEN SOURCE · HEADLESS BY DESIGN
          </div>
          <h1
            className="landing-title reveal"
            style={{ animationDelay: '230ms' }}
          >
            Your music.
            <br />
            <span>Your canvas.</span>
          </h1>
          <p
            className="landing-intro reveal"
            style={{ animationDelay: '340ms' }}
          >
            Spotify data, without the prescribed interface. Explore six looks
            built with the same hooks you can use in your own app.
          </p>
          <div
            className="landing-actions reveal"
            style={{ animationDelay: '440ms' }}
          >
            <a
              className="primary-button"
              href="/react/"
              data-analytics-event="demo_open"
              data-analytics-framework="react"
            >
              Enter playground <span aria-hidden="true">↗</span>
            </a>
            <a className="text-button" href="#choose-framework">
              Explore both builds ↓
            </a>
          </div>
          <div
            className="landing-metrics reveal"
            style={{ animationDelay: '530ms' }}
          >
            <div>
              <strong>03</strong>
              <span>hooks in motion</span>
            </div>
            <div>
              <strong>02</strong>
              <span>framework builds</span>
            </div>
            <div>
              <strong>00</strong>
              <span>credentials needed</span>
            </div>
          </div>
        </section>

        <div
          className="hero-scene reveal"
          style={{ animationDelay: '310ms' }}
          aria-label="Preview of three music interface styles"
        >
          <div className="scene-halo" />
          <div className="scene-card scene-card--back">
            <span className="scene-tiny">TOP TRACKS / 01</span>
            <span className="scene-line" />
            <span className="scene-line short" />
          </div>
          <div className="scene-card scene-card--mid">
            <span className="scene-tiny">EDITORIAL VIEW</span>
            <span className="scene-orb" />
            <span className="scene-line" />
          </div>
          <div className="scene-card scene-card--front">
            <div className="scene-card-top">
              <span className="live-dot" /> NOW PLAYING <span>● ● ●</span>
            </div>
            <div className="scene-art">
              <span className="scene-art-disc" />
            </div>
            <div className="scene-song">Afterglow Circuit</div>
            <div className="scene-artist">Aria Vale · Soft Signals</div>
            <div className="scene-progress">
              <span />
            </div>
            <div className="scene-wave" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <span className="scene-caption">DESIGN IS YOURS TO DECIDE ↗</span>
        </div>
      </div>

      <section id="choose-framework" className="framework-section">
        <div className="section-heading">
          <div>
            <span className="section-kicker">PICK A BUILD</span>
            <h2>Same data. Same experience.</h2>
          </div>
          <p>
            Two implementations, one visual language. Switch between them inside
            the playground.
          </p>
        </div>
        <div className="framework-cards">
          <a
            href="/react/"
            className="framework-card"
            data-analytics-event="demo_open"
            data-analytics-framework="react"
          >
            <span className="framework-index">01 / REACT</span>
            <span className="framework-symbol">◉</span>
            <strong>React + Vite</strong>
            <span>See the hooks in a lightweight client app.</span>
            <span className="framework-arrow">↗</span>
          </a>
          <a
            href="/next/"
            className="framework-card"
            data-analytics-event="demo_open"
            data-analytics-framework="next"
          >
            <span className="framework-index">02 / NEXT.JS</span>
            <span className="framework-symbol framework-symbol--next">N</span>
            <strong>Next.js App Router</strong>
            <span>Explore the same interface in a Next.js app.</span>
            <span className="framework-arrow">↗</span>
          </a>
        </div>
        <p className="landing-footnote">
          All music and artwork in this demo are fictional. No Spotify account
          is connected.
        </p>
      </section>
      <footer className="landing-footer">
        <span>
          Made by{' '}
          <a href="https://sush.dev/" target="_blank" rel="noreferrer">
            Sushil Buragute
          </a>
          .
        </span>
        <nav aria-label="More links">
          <a
            href={repository}
            data-analytics-event="resource_open"
            data-analytics-resource="project_source"
            target="_blank"
            rel="noreferrer"
          >
            Project source ↗
          </a>
          <a
            href="https://github.com/sushilburagute"
            target="_blank"
            rel="noreferrer"
          >
            Sushil on GitHub ↗
          </a>
          <a
            href="/agent-guide.md"
            data-analytics-event="resource_open"
            data-analytics-resource="agent_guide"
          >
            Implementation guide ↗
          </a>
        </nav>
      </footer>
    </main>
  )
}

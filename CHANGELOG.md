# Changelog

## 1.1.0

- Cache access tokens and share concurrent refresh operations.
- Handle refresh-token rotation through `onRefreshToken`.
- Retry Spotify API requests once after an unauthorized response.
- Support currently playing podcast episodes.
- Normalize top-item limits and improve typed error handling.
- Add abort-safe React requests and awaitable `mutate()` functions.
- Add configurable Next.js response caching and defer configuration failures
  until request time.
- Add classic TypeScript module-resolution compatibility.
- Add production-tested Next.js and React + Vite examples.
- Add CI, coverage thresholds, npm provenance publishing, and the MIT license.

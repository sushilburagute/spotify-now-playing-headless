# spotify-now-playing-headless

Headless, TypeScript-first Spotify data for portfolio sites and personal apps.
It provides a server-side Spotify client, React hooks, and Next.js App Router
route factories for Now Playing, Top Tracks, and Top Artists.

## Features

- Unstyled and UI-agnostic
- ESM and CommonJS builds with TypeScript declarations
- Server-side access-token caching and one automatic retry after a `401`
- Refresh-token rotation callback
- Typed rate-limit and authentication errors
- Abort-safe React hooks with optional polling
- Configurable caching for Next.js Route Handlers

## Requirements

- Node.js 18 or newer for the server-side client
- React 18 or newer for `spotify-now-playing-headless/react`
- Next.js 13 or newer for `spotify-now-playing-headless/nextjs`

## Installation

```bash
npm install spotify-now-playing-headless
```

Use the explicit entry point for your environment:

```ts
import { SpotifyClient } from 'spotify-now-playing-headless/core'
import { useNowPlaying } from 'spotify-now-playing-headless/react'
import { createNowPlayingRoute } from 'spotify-now-playing-headless/nextjs'
```

## Next.js App Router

Keep all Spotify credentials in the server-only Route Handler:

```ts
// app/api/now-playing/route.ts
import { createNowPlayingRoute } from 'spotify-now-playing-headless/nextjs'

export const dynamic = 'force-dynamic'

export const GET = createNowPlayingRoute({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
  cacheControl: 'public, s-maxage=30, stale-while-revalidate=30',
  onRefreshToken: async (refreshToken) => {
    // Persist this value in your secrets manager or database.
  },
})
```

Consume the endpoint from a Client Component:

```tsx
'use client'

import { useNowPlaying } from 'spotify-now-playing-headless/react'

export function NowPlaying() {
  const { data, error, isLoading, mutate } = useNowPlaying({
    endpoint: '/api/now-playing',
    refreshInterval: 30_000,
  })

  if (isLoading && !data) return <p>Loading…</p>
  if (error) return <p>Could not load Spotify: {error.message}</p>
  if (!data?.isPlaying) return <p>Nothing is playing.</p>

  return (
    <article>
      <img src={data.albumImageUrl} alt={data.album} />
      <a href={data.songUrl}>{data.title}</a>
      <p>{data.artist}</p>
      <button type="button" onClick={() => void mutate()}>
        Refresh
      </button>
    </article>
  )
}
```

Next.js Route Handlers are dynamic by default in current Next.js releases. The
route factories use HTTP `Cache-Control`; they do not configure ISR. Set
`cacheControl: false` to omit the header.

## React + Vite

The React hooks work in Vite. Vite itself does not provide a production API
server, so the browser must call a separate Node/serverless endpoint that uses
`SpotifyClient`.

```tsx
import { useNowPlaying } from 'spotify-now-playing-headless/react'

export function NowPlaying() {
  const result = useNowPlaying({ endpoint: '/api/now-playing' })
  return <p>{result.data?.title ?? 'Nothing playing'}</p>
}
```

Never expose `clientSecret` or `refreshToken` through `VITE_*` variables. See
[`examples/react-vite`](examples/react-vite) for a Vite app with a small Node
backend.

Next.js does not use Vite. A package can be consumed by Next.js and by Vite
applications separately, but Vite is not a supported replacement for the
Next.js bundler.

## Core client

```ts
import { SpotifyClient } from 'spotify-now-playing-headless/core'

const spotify = new SpotifyClient({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
  onRefreshToken: async (refreshToken) => {
    await saveRefreshToken(refreshToken)
  },
})

const nowPlaying = await spotify.getNowPlaying()
const topTracks = await spotify.getTopTracks(10)
const topArtists = await spotify.getTopArtists(10)
```

Access tokens are reused until shortly before expiry. Concurrent requests share
one token refresh. If Spotify returns a new refresh token, the client uses it
immediately and calls `onRefreshToken`; production applications should persist
that value.

### Custom endpoints

Endpoint overrides are useful for tests, proxies, or compatible API gateways:

```ts
const spotify = new SpotifyClient({
  clientId: 'client-id',
  clientSecret: 'client-secret',
  refreshToken: 'refresh-token',
  endpoints: {
    token: 'https://auth.example.com/token',
    nowPlaying: 'https://api.example.com/now-playing',
    topTracks: 'https://api.example.com/top-tracks',
    topArtists: 'https://api.example.com/top-artists',
  },
})
```

## React hooks

The package exports `useNowPlaying`, `useTopTracks`, and `useTopArtists`. Each
accepts:

- `endpoint`: URL of your server endpoint
- `enabled`: whether requests should run; defaults to `true`
- `refreshInterval`: polling interval in milliseconds; defaults to `0`
- `fetcher`: optional `(url, { signal }) => Promise<T>` implementation

Each returns `{ data, error, isLoading, mutate }`. `mutate()` returns a promise,
aborts an older in-flight request, and can be awaited.

## Next.js route factories

- `createNowPlayingRoute(options)`
- `createTopTracksRoute({ ...options, limit })`
- `createTopArtistsRoute({ ...options, limit })`

All accept `cacheControl?: string | false`. Limits are normalized to an integer
between 1 and 50.

The factories target App Router `route.ts` files. With the Pages Router, use
`SpotifyClient` directly inside `pages/api/*` and translate its result to the
Pages Router response object.

## Authentication

Create an app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
and register a redirect URI. Spotify requires HTTPS except for explicit
loopback IPs; `localhost` is not accepted. For local development, use for
example:

```text
http://127.0.0.1:3000/api/callback
```

Request authorization with the scopes used by this package:

```text
https://accounts.spotify.com/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http%3A%2F%2F127.0.0.1%3A3000%2Fapi%2Fcallback&scope=user-read-currently-playing%20user-top-read&state=RANDOM_CSRF_VALUE
```

Exchange the returned code from a trusted server. The redirect URI must exactly
match the authorization request and Dashboard entry:

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=http://127.0.0.1:3000/api/callback"
```

Store the refresh token as a server secret:

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

Spotify currently documents a six-month lifetime for Dashboard-issued refresh
tokens. Reauthorize after expiration. Always validate the OAuth `state` value
in a real callback handler.

## Errors

`SpotifyError` extends `Error` and has these codes:

- `AUTH_FAILED`: credentials, token, or required scopes are invalid
- `RATE_LIMITED`: retry later; `retryAfter` may contain seconds
- `NETWORK_ERROR`: Spotify or the network returned an operational failure
- `INVALID_CONFIG`: a required constructor value is missing
- `UNKNOWN_ERROR`: unexpected data, parsing, or persistence failure

`NOT_PLAYING` remains in the public type for compatibility. No playback is
represented by `{ isPlaying: false }`, not by an exception.

## Examples

- [`examples/nextjs-app-router`](examples/nextjs-app-router)
- [`examples/react-vite`](examples/react-vite)

## Development

```bash
yarn install
yarn check
yarn test:coverage
npm pack --dry-run
```

CI tests supported Node.js releases and validates the packed artifact. Publishing
is triggered by a GitHub Release and requires an `NPM_TOKEN` secret in the `npm`
environment.

## License

MIT

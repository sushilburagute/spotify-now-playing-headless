# Implement spotify-now-playing-headless

This guide is for a developer or coding agent adding the package to a consumer app. The [interactive playground](https://headless-spotify.sush.dev/) is a mock-data demonstration of the React hooks. It does not call Spotify.

## Install

```bash
npm install spotify-now-playing-headless
```

Use Node.js 18 or newer for the server client, React 18 or newer for the hooks, and Next.js 13 or newer for the App Router factories. Check the [package README](https://github.com/sushilburagute/spotify-now-playing-headless#readme) for current requirements and setup details.

## Choose the entry point

- `spotify-now-playing-headless/core`: `SpotifyClient` and response types for trusted server code.
- `spotify-now-playing-headless/react`: `useNowPlaying`, `useTopTracks`, and `useTopArtists` for client UI.
- `spotify-now-playing-headless/nextjs`: `createNowPlayingRoute`, `createTopTracksRoute`, and `createTopArtistsRoute` for Next.js App Router route handlers.

## Secure architecture

1. Keep `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and `SPOTIFY_REFRESH_TOKEN` in server environment variables.
2. Build a server endpoint with a route factory or `SpotifyClient`. Return its JSON result to the browser.
3. Persist any refresh token received by `onRefreshToken`; otherwise a rotated token can be lost on restart or redeploy.
4. Point the React hooks at your own endpoints. Never place secrets in `VITE_*` variables or client components.
5. Handle loading, errors, and `{ isPlaying: false }` in the UI. The hooks return `{ data, error, isLoading, mutate }`.

## Next.js example

```ts
// app/api/now-playing/route.ts
import { createNowPlayingRoute } from 'spotify-now-playing-headless/nextjs'

export const dynamic = 'force-dynamic'
export const GET = createNowPlayingRoute({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
  onRefreshToken: async (token) => {
    await saveRotatedToken(token) // implement using your secret store or database
  },
})
```

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
    <button onClick={() => void mutate()}>
      {data.title} — {data.artist}
    </button>
  )
}
```

## React + Vite example

The hooks work in Vite, but Vite does not provide a production API server. Host a separate Node or serverless endpoint using `SpotifyClient`, then call it with `useNowPlaying({ endpoint: '/api/now-playing' })`. The [Vite example](https://github.com/sushilburagute/spotify-now-playing-headless/tree/main/examples/react-vite) includes a small Node backend.

## Copy a prompt

Use [prompt.txt](https://headless-spotify.sush.dev/prompt.txt) as a starting point for a coding agent. Fill in your framework, desired UI, and secret storage before running it.

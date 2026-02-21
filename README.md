# spotify-now-playing-headless

> Headless Spotify integration for portfolio websites. Now Playing, Top Tracks, and Top Artists.

A lightweight, TypeScript-first package for integrating Spotify data into your portfolio website. Completely unstyled and framework-agnostic with first-class support for React and Next.js.

## Features

- **100% Headless** - No built-in styles, bring your own UI
- **TypeScript-first** - Full type safety with comprehensive types
- **Framework-agnostic core** - Use with any JavaScript framework
- **React hooks** - Built-in hooks with auto-refresh support
- **Next.js helpers** - One-line API route creation with ISR support
- **Three Spotify APIs** - Now Playing, Top Tracks, and Top Artists
- **OAuth handled** - Refresh token flow built-in
- **Error handling** - Typed errors with retry information
- **Tree-shakeable** - Only bundle what you use (ESM + CJS)

## Installation

```bash
npm install spotify-now-playing-headless
# or
yarn add spotify-now-playing-headless
# or
pnpm add spotify-now-playing-headless
```

## Quick Start

### Prerequisites

You'll need Spotify API credentials:

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Get your `Client ID` and `Client Secret`
4. Generate a refresh token (see [Authentication](#authentication))

### Next.js Example

```typescript
// app/api/now-playing/route.ts
import { createNowPlayingRoute } from 'spotify-now-playing-headless/nextjs'

export const GET = createNowPlayingRoute({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
})

export const revalidate = 120 // Revalidate every 2 minutes
```

```tsx
// components/NowPlaying.tsx
'use client'

import { useNowPlaying } from 'spotify-now-playing-headless/react'

export function NowPlaying() {
  const { data, isLoading, error } = useNowPlaying({
    endpoint: '/api/now-playing',
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data?.isPlaying) return <div>Not playing anything</div>

  return (
    <div>
      <h3>Now Playing</h3>
      <a href={data.songUrl} target="_blank" rel="noopener noreferrer">
        <img src={data.albumImageUrl} alt={data.album} />
        <div>
          <p>{data.title}</p>
          <p>{data.artist}</p>
        </div>
      </a>
    </div>
  )
}
```

## API Reference

### Core

The core module provides a framework-agnostic Spotify API client.

#### `SpotifyClient`

```typescript
import { SpotifyClient } from 'spotify-now-playing-headless/core'

const spotify = new SpotifyClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  refreshToken: 'your-refresh-token',
})

// Get now playing
const nowPlaying = await spotify.getNowPlaying()

// Get top tracks (default: 10, max: 50)
const topTracks = await spotify.getTopTracks(10)

// Get top artists (default: 10, max: 50)
const topArtists = await spotify.getTopArtists(10)
```

### React Hooks

The React module provides headless hooks for data fetching.

#### `useNowPlaying`

```typescript
import { useNowPlaying } from 'spotify-now-playing-headless/react'

const { data, error, isLoading, mutate } = useNowPlaying({
  endpoint: '/api/now-playing',
  refreshInterval: 30000, // Optional: auto-refresh every 30s
  enabled: true, // Optional: enable/disable fetching
})
```

#### `useTopTracks`

```typescript
import { useTopTracks } from 'spotify-now-playing-headless/react'

const { data, error, isLoading, mutate } = useTopTracks({
  endpoint: '/api/top-tracks',
})
```

#### `useTopArtists`

```typescript
import { useTopArtists } from 'spotify-now-playing-headless/react'

const { data, error, isLoading, mutate } = useTopArtists({
  endpoint: '/api/top-artists',
})
```

**Hook Options:**

- `endpoint` - API endpoint to fetch from
- `fetcher` - Optional custom fetcher function
- `refreshInterval` - Optional auto-refresh interval in ms (0 = disabled)
- `enabled` - Optional enable/disable fetching (default: true)

### Next.js API Routes

The Next.js module provides route factories for easy API route creation.

#### `createNowPlayingRoute`

```typescript
import { createNowPlayingRoute } from 'spotify-now-playing-headless/nextjs'

export const GET = createNowPlayingRoute({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
})

export const revalidate = 120
```

#### `createTopTracksRoute`

```typescript
import { createTopTracksRoute } from 'spotify-now-playing-headless/nextjs'

export const GET = createTopTracksRoute({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
  limit: 10, // Optional: number of tracks (default: 10, max: 50)
})

export const revalidate = 3640 // Revalidate every ~1 hour
```

#### `createTopArtistsRoute`

```typescript
import { createTopArtistsRoute } from 'spotify-now-playing-headless/nextjs'

export const GET = createTopArtistsRoute({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
  limit: 10, // Optional: number of artists (default: 10, max: 50)
})

export const revalidate = 3640
```

## TypeScript Types

All types are exported from the core module:

```typescript
import type {
  SpotifyConfig,
  NowPlayingResponse,
  TopTracksResponse,
  TopArtistsResponse,
  SpotifyError,
  Song,
  Artist,
  AlbumArt,
} from 'spotify-now-playing-headless/core'
```

### `NowPlayingResponse`

```typescript
type NowPlayingResponse = {
  album: string
  albumImageUrl: string
  artist: string // Comma-separated list
  isPlaying: boolean
  songUrl: string
  title: string
}
```

### `TopTracksResponse`

```typescript
type TopTracksResponse = {
  tracks: Song[]
}

type Song = {
  songUrl: string
  artist: string
  title: string
  albumArt: AlbumArt
}
```

### `TopArtistsResponse`

```typescript
type TopArtistsResponse = {
  artists: Artist[]
}

type Artist = {
  name: string
  url: string
  image?: {
    url: string
    height: number
    width: number
  }
  followers?: number
  genres?: string[]
}
```

## Authentication

To use this package, you need a Spotify refresh token. Here's how to get one:

### Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click "Create app"
3. Fill in the details:
   - **App name**: Your Portfolio
   - **App description**: For personal website
   - **Redirect URI**: `http://localhost:3000/api/callback` (or your domain)
4. Save your **Client ID** and **Client Secret**

### Step 2: Get Authorization Code

Visit this URL in your browser (replace `CLIENT_ID` with your Client ID):

```
https://accounts.spotify.com/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=http://localhost:3000/api/callback&scope=user-read-currently-playing%20user-top-read
```

After authorizing, you'll be redirected to:

```
http://localhost:3000/api/callback?code=AUTHORIZATION_CODE
```

Copy the `AUTHORIZATION_CODE` from the URL.

### Step 3: Exchange for Refresh Token

Run this command (replace `CLIENT_ID`, `CLIENT_SECRET`, and `AUTHORIZATION_CODE`):

```bash
curl -X POST https://accounts.spotify.com/api/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "redirect_uri=http://localhost:3000/api/callback" \
  -d "client_id=CLIENT_ID" \
  -d "client_secret=CLIENT_SECRET"
```

The response will include a `refresh_token`. Save this - it doesn't expire!

### Step 4: Add to Environment Variables

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REFRESH_TOKEN=your_refresh_token
```

## Advanced Usage

### Custom Fetcher

You can provide your own fetcher function (e.g., using SWR or React Query):

```typescript
import useSWR from 'swr'
import { useNowPlaying } from 'spotify-now-playing-headless/react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const { data } = useNowPlaying({
  endpoint: '/api/now-playing',
  fetcher,
})
```

### Auto-Refresh

Enable automatic data refreshing:

```typescript
const { data } = useNowPlaying({
  endpoint: '/api/now-playing',
  refreshInterval: 30000, // Refresh every 30 seconds
})
```

### Manual Refresh

Trigger a manual refetch:

```typescript
const { data, mutate } = useNowPlaying({
  endpoint: '/api/now-playing',
})

// Later...
<button onClick={() => mutate()}>Refresh</button>
```

### Conditional Fetching

Control when data is fetched:

```typescript
const [enabled, setEnabled] = useState(false)

const { data } = useNowPlaying({
  endpoint: '/api/now-playing',
  enabled, // Only fetch when enabled is true
})
```

### Error Handling

All methods return typed errors:

```typescript
try {
  const data = await spotify.getNowPlaying()
} catch (err) {
  const error = err as SpotifyError

  if (error.code === 'RATE_LIMITED') {
    console.log(`Rate limited. Retry after ${error.retryAfter} seconds`)
  } else if (error.code === 'AUTH_FAILED') {
    console.log('Authentication failed. Check your credentials.')
  }
}
```

**Error Codes:**

- `AUTH_FAILED` - Invalid credentials or expired token
- `RATE_LIMITED` - Too many requests (includes retryAfter)
- `NETWORK_ERROR` - Network or API error
- `NOT_PLAYING` - No track currently playing
- `INVALID_CONFIG` - Missing required configuration
- `UNKNOWN_ERROR` - Unexpected error

### Custom Endpoints (Advanced)

Override Spotify API endpoints:

```typescript
const spotify = new SpotifyClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  refreshToken: 'your-refresh-token',
  endpoints: {
    nowPlaying: 'https://custom-api.com/now-playing',
    topTracks: 'https://custom-api.com/top-tracks',
    topArtists: 'https://custom-api.com/top-artists',
    token: 'https://custom-auth.com/token',
  },
})
```

## Examples

Check out the `/examples` directory for complete working examples:

- **Next.js App Router** - Full integration with App Router
- **Next.js Pages Router** - Legacy Pages Router example
- **React + Vite** - Standalone React application

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

MIT

## Acknowledgments

Built with:

- [tsup](https://github.com/egoist/tsup) - TypeScript bundler
- [Vitest](https://vitest.dev) - Testing framework
- [React](https://react.dev) - UI library (peer dependency)
- [Next.js](https://nextjs.org) - React framework (peer dependency)

---

**Made with ❤️ for portfolio websites**

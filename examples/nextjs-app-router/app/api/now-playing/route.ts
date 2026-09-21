import { createNowPlayingRoute } from 'spotify-now-playing-headless/nextjs'

export const dynamic = 'force-dynamic'

export const GET = createNowPlayingRoute({
  clientId: process.env.SPOTIFY_CLIENT_ID!,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
  refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
  cacheControl: 'public, s-maxage=30, stale-while-revalidate=30',
  onRefreshToken: (refreshToken) => {
    // Persist this value in your secrets manager for the next deployment.
    console.warn('Spotify rotated the refresh token', refreshToken.length)
  },
})

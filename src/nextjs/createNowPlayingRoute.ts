import { SpotifyClient } from '../core/SpotifyClient'
import { SpotifyError } from '../core/types'
import type { SpotifyConfig } from '../core/types'

/**
 * Create a Next.js App Router API route handler for Now Playing
 *
 * This factory function creates a GET handler that fetches the currently
 * playing track from Spotify and returns it in a standardized format.
 *
 * @param config - Spotify API configuration
 * @returns Next.js API route GET handler
 *
 * @example
 * ```typescript
 * // app/api/now-playing/route.ts
 * import { createNowPlayingRoute } from 'spotify-now-playing-headless/nextjs'
 *
 * export const GET = createNowPlayingRoute({
 *   clientId: process.env.SPOTIFY_CLIENT_ID!,
 *   clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
 *   refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
 * })
 *
 * // Optional: Configure ISR revalidation
 * export const revalidate = 120 // Revalidate every 2 minutes
 * ```
 */
export function createNowPlayingRoute(config: SpotifyConfig) {
  const client = new SpotifyClient(config)

  return async function GET() {
    try {
      const data = await client.getNowPlaying()

      return Response.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      })
    } catch (err) {
      if (err instanceof SpotifyError) {
        if (err.code === 'AUTH_FAILED') {
          return Response.json(
            {
              error: 'Authentication failed',
              message: err.message,
            },
            { status: 401 }
          )
        }

        if (err.code === 'RATE_LIMITED') {
          return Response.json(
            {
              error: 'Rate limited',
              message: err.message,
              retryAfter: err.retryAfter,
            },
            {
              status: 429,
              headers: err.retryAfter
                ? { 'Retry-After': err.retryAfter.toString() }
                : {},
            }
          )
        }
      }

      // Generic error response
      const message = err instanceof Error ? err.message : 'Unknown error'
      return Response.json(
        {
          error: 'Failed to fetch now playing',
          message,
        },
        { status: 500 }
      )
    }
  }
}

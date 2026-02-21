import { SpotifyClient } from '../core/SpotifyClient'
import { SpotifyError } from '../core/types'
import type { SpotifyConfig } from '../core/types'

/**
 * Options for creating a top tracks route
 */
export type CreateTopTracksRouteOptions = SpotifyConfig & {
  /** Number of tracks to return. Default: 10, Max: 50 */
  limit?: number
}

/**
 * Create a Next.js App Router API route handler for Top Tracks
 *
 * This factory function creates a GET handler that fetches the user's
 * top tracks from Spotify and returns them in a standardized format.
 *
 * @param options - Spotify API configuration and options
 * @returns Next.js API route GET handler
 *
 * @example
 * ```typescript
 * // app/api/top-tracks/route.ts
 * import { createTopTracksRoute } from 'spotify-now-playing-headless/nextjs'
 *
 * export const GET = createTopTracksRoute({
 *   clientId: process.env.SPOTIFY_CLIENT_ID!,
 *   clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
 *   refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
 *   limit: 10,
 * })
 *
 * // Optional: Configure ISR revalidation
 * export const revalidate = 3600 // Revalidate every 1 hour
 * ```
 */
export function createTopTracksRoute(options: CreateTopTracksRouteOptions) {
  const { limit = 10, ...config } = options
  const client = new SpotifyClient(config)

  return async function GET() {
    try {
      const data = await client.getTopTracks(limit)

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
          error: 'Failed to fetch top tracks',
          message,
        },
        { status: 500 }
      )
    }
  }
}

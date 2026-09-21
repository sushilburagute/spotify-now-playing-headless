import { SpotifyClient } from '../core/SpotifyClient'
import type { SpotifyConfig } from '../core/types'
import {
  createErrorResponse,
  createSuccessResponse,
  type SpotifyRouteOptions,
} from './routeUtils'

/**
 * Options for creating a top tracks route
 */
export type CreateTopTracksRouteOptions = SpotifyConfig &
  SpotifyRouteOptions & {
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
 * export const dynamic = 'force-dynamic'
 * ```
 */
export function createTopTracksRoute(options: CreateTopTracksRouteOptions) {
  const { limit = 10, cacheControl, ...config } = options
  let client: SpotifyClient | undefined
  let initializationError: unknown

  try {
    client = new SpotifyClient(config)
  } catch (err) {
    initializationError = err
  }

  return async function GET() {
    try {
      if (!client) throw initializationError
      const data = await client.getTopTracks(limit)

      return createSuccessResponse(data, { cacheControl })
    } catch (err) {
      return createErrorResponse(err, 'top tracks')
    }
  }
}

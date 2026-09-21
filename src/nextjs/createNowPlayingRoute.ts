import { SpotifyClient } from '../core/SpotifyClient'
import type { SpotifyConfig } from '../core/types'
import {
  createErrorResponse,
  createSuccessResponse,
  type SpotifyRouteOptions,
} from './routeUtils'

export type CreateNowPlayingRouteOptions = SpotifyConfig & SpotifyRouteOptions

/**
 * Create a Next.js App Router API route handler for Now Playing
 *
 * This factory function creates a GET handler that fetches the currently
 * playing track from Spotify and returns it in a standardized format.
 *
 * @param options - Spotify API configuration and response cache options
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
 * export const dynamic = 'force-dynamic'
 * ```
 */
export function createNowPlayingRoute(options: CreateNowPlayingRouteOptions) {
  const { cacheControl, ...config } = options
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
      const data = await client.getNowPlaying()

      return createSuccessResponse(data, { cacheControl })
    } catch (err) {
      return createErrorResponse(err, 'now playing')
    }
  }
}

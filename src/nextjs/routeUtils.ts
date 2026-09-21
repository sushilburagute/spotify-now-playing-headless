import { SpotifyError } from '../core/types'

export type SpotifyRouteOptions = {
  /**
   * Value for the Cache-Control response header.
   * Set to false to omit the header. Defaults to a 60-second shared cache.
   */
  cacheControl?: string | false
}

const DEFAULT_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=30'

export function createSuccessResponse(
  data: unknown,
  options: SpotifyRouteOptions
): Response {
  const cacheControl = options.cacheControl ?? DEFAULT_CACHE_CONTROL
  const headers =
    cacheControl === false ? undefined : { 'Cache-Control': cacheControl }

  return Response.json(data, { headers })
}

export function createErrorResponse(err: unknown, resource: string): Response {
  if (err instanceof SpotifyError) {
    if (err.code === 'AUTH_FAILED' || err.code === 'INVALID_CONFIG') {
      return Response.json(
        {
          error:
            err.code === 'INVALID_CONFIG'
              ? 'Invalid Spotify configuration'
              : 'Authentication failed',
          message: err.message,
        },
        { status: err.code === 'INVALID_CONFIG' ? 500 : 401 }
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
          headers:
            err.retryAfter === undefined
              ? undefined
              : { 'Retry-After': err.retryAfter.toString() },
        }
      )
    }
  }

  const message = err instanceof Error ? err.message : 'Unknown error'
  return Response.json(
    {
      error: `Failed to fetch ${resource}`,
      message,
    },
    { status: 500 }
  )
}

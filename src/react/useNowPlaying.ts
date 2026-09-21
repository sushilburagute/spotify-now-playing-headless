import type { NowPlayingResponse } from '../core/types'
import { useSpotifyEndpoint, type SpotifyFetcher } from './useSpotifyEndpoint'

/**
 * Options for the useNowPlaying hook
 */
export type UseNowPlayingOptions = {
  /** The API endpoint to fetch from */
  endpoint: string
  /** Custom fetcher function. Defaults to native fetch with JSON parsing */
  fetcher?: SpotifyFetcher<NowPlayingResponse>
  /** Refresh interval in milliseconds. Set to 0 to disable auto-refresh */
  refreshInterval?: number
  /** Whether to fetch on mount. Defaults to true */
  enabled?: boolean
}

/**
 * Result from the useNowPlaying hook
 */
export type UseNowPlayingResult = {
  /** Now playing data, or undefined if not loaded */
  data: NowPlayingResponse | undefined
  /** Error object if the request failed */
  error: Error | undefined
  /** Whether the data is currently being fetched */
  isLoading: boolean
  /** Manually trigger a refetch */
  mutate: () => Promise<void>
}

/**
 * React hook for fetching Spotify Now Playing data
 *
 * This is a headless hook that handles data fetching and state management.
 * You can provide your own fetcher function (e.g., using SWR or React Query)
 * or use the default fetch-based implementation.
 *
 * @param options - Configuration options for the hook
 * @returns Now playing data, loading state, error, and mutate function
 *
 * @example
 * ```typescript
 * // Basic usage with default fetcher
 * const { data, isLoading, error } = useNowPlaying({
 *   endpoint: '/api/now-playing'
 * })
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 * if (data?.isPlaying) {
 *   return <div>Now playing: {data.title} by {data.artist}</div>
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With custom fetcher (SWR)
 * import useSWR from 'swr'
 *
 * const { data } = useNowPlaying({
 *   endpoint: '/api/now-playing',
 *   fetcher: (url) => fetch(url).then(r => r.json())
 * })
 * ```
 *
 * @example
 * ```typescript
 * // With auto-refresh every 30 seconds
 * const { data } = useNowPlaying({
 *   endpoint: '/api/now-playing',
 *   refreshInterval: 30000
 * })
 * ```
 */
export function useNowPlaying(
  options: UseNowPlayingOptions
): UseNowPlayingResult {
  return useSpotifyEndpoint(options)
}

import { useState, useEffect, useCallback, useRef } from 'react'
import type { NowPlayingResponse } from '../core/types'

/**
 * Options for the useNowPlaying hook
 */
export type UseNowPlayingOptions = {
  /** The API endpoint to fetch from */
  endpoint: string
  /** Custom fetcher function. Defaults to native fetch with JSON parsing */
  fetcher?: (url: string) => Promise<NowPlayingResponse>
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
  mutate: () => void
}

/**
 * Default fetcher using native fetch
 */
const defaultFetcher = async (url: string): Promise<NowPlayingResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
  }
  return response.json()
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
  const {
    endpoint,
    fetcher = defaultFetcher,
    refreshInterval = 0,
    enabled = true,
  } = options

  const [data, setData] = useState<NowPlayingResponse | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setIsLoading(true)
    setError(undefined)

    try {
      const result = await fetcher(endpoint)
      setData(result)
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch now playing')
      )
    } finally {
      setIsLoading(false)
    }
  }, [endpoint, fetcher, enabled])

  const mutate = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData()
      }, refreshInterval)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [refreshInterval, fetchData, enabled])

  return {
    data,
    error,
    isLoading,
    mutate,
  }
}

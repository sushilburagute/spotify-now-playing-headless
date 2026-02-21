import { useState, useEffect, useCallback, useRef } from 'react'
import type { TopArtistsResponse } from '../core/types'

/**
 * Options for the useTopArtists hook
 */
export type UseTopArtistsOptions = {
  /** The API endpoint to fetch from */
  endpoint: string
  /** Custom fetcher function. Defaults to native fetch with JSON parsing */
  fetcher?: (url: string) => Promise<TopArtistsResponse>
  /** Refresh interval in milliseconds. Set to 0 to disable auto-refresh */
  refreshInterval?: number
  /** Whether to fetch on mount. Defaults to true */
  enabled?: boolean
}

/**
 * Result from the useTopArtists hook
 */
export type UseTopArtistsResult = {
  /** Top artists data, or undefined if not loaded */
  data: TopArtistsResponse | undefined
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
const defaultFetcher = async (url: string): Promise<TopArtistsResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

/**
 * React hook for fetching Spotify Top Artists data
 *
 * This is a headless hook that handles data fetching and state management.
 * You can provide your own fetcher function (e.g., using SWR or React Query)
 * or use the default fetch-based implementation.
 *
 * @param options - Configuration options for the hook
 * @returns Top artists data, loading state, error, and mutate function
 *
 * @example
 * ```typescript
 * const { data, isLoading, error } = useTopArtists({
 *   endpoint: '/api/top-artists'
 * })
 *
 * if (isLoading) return <div>Loading...</div>
 * if (error) return <div>Error: {error.message}</div>
 * if (data) {
 *   return (
 *     <ul>
 *       {data.artists.map((artist) => (
 *         <li key={artist.url}>
 *           {artist.name} - {artist.followers} followers
 *         </li>
 *       ))}
 *     </ul>
 *   )
 * }
 * ```
 */
export function useTopArtists(
  options: UseTopArtistsOptions
): UseTopArtistsResult {
  const {
    endpoint,
    fetcher = defaultFetcher,
    refreshInterval = 0,
    enabled = true,
  } = options

  const [data, setData] = useState<TopArtistsResponse | undefined>(undefined)
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
        err instanceof Error ? err : new Error('Failed to fetch top artists')
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

import { useCallback, useEffect, useRef, useState } from 'react'

export type SpotifyFetcherOptions = {
  signal: AbortSignal
}

export type SpotifyFetcher<T> = (
  url: string,
  options?: SpotifyFetcherOptions
) => Promise<T>

export type UseSpotifyEndpointOptions<T> = {
  endpoint: string
  fetcher?: SpotifyFetcher<T>
  refreshInterval?: number
  enabled?: boolean
}

export type UseSpotifyEndpointResult<T> = {
  data: T | undefined
  error: Error | undefined
  isLoading: boolean
  mutate: () => Promise<void>
}

async function defaultFetcher<T>(
  url: string,
  options?: SpotifyFetcherOptions
): Promise<T> {
  const response = await fetch(url, { signal: options?.signal })
  if (!response.ok) {
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`
    )
  }
  return response.json()
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    err.name === 'AbortError'
  )
}

export function useSpotifyEndpoint<T>(
  options: UseSpotifyEndpointOptions<T>
): UseSpotifyEndpointResult<T> {
  const {
    endpoint,
    fetcher = defaultFetcher<T>,
    refreshInterval = 0,
    enabled = true,
  } = options

  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const requestIdRef = useRef(0)
  const controllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) {
      controllerRef.current?.abort()
      setIsLoading(false)
      return
    }

    controllerRef.current?.abort()
    const controller = new AbortController()
    const requestId = requestIdRef.current + 1
    controllerRef.current = controller
    requestIdRef.current = requestId

    setIsLoading(true)
    setError(undefined)

    try {
      const result = await fetcher(endpoint, { signal: controller.signal })

      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setData(result)
      }
    } catch (err) {
      if (
        !controller.signal.aborted &&
        requestId === requestIdRef.current &&
        !isAbortError(err)
      ) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'))
      }
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setIsLoading(false)
      }
    }
  }, [enabled, endpoint, fetcher])

  useEffect(() => {
    void fetchData()

    return () => {
      controllerRef.current?.abort()
    }
  }, [fetchData])

  useEffect(() => {
    if (refreshInterval <= 0 || !enabled) return

    const interval = setInterval(() => {
      void fetchData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [enabled, fetchData, refreshInterval])

  return { data, error, isLoading, mutate: fetchData }
}

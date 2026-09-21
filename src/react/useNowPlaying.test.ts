import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useNowPlaying } from './useNowPlaying'
import type { NowPlayingResponse } from '../core/types'

const mockNowPlaying: NowPlayingResponse = {
  album: 'Test Album',
  albumImageUrl: 'https://example.com/image.jpg',
  artist: 'Test Artist',
  isPlaying: true,
  songUrl: 'https://open.spotify.com/track/123',
  title: 'Test Song',
}

function mockFetchSuccess(data: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => data,
  } as Response)
}

function mockFetchError(status = 500, statusText = 'Internal Server Error') {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
  } as Response)
}

describe('useNowPlaying', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in loading state and resolves with data', async () => {
    mockFetchSuccess(mockNowPlaying)

    const { result } = renderHook(() =>
      useNowPlaying({ endpoint: '/api/now-playing' })
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeUndefined()

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(mockNowPlaying)
    expect(result.current.error).toBeUndefined()
  })

  it('sets error on fetch failure', async () => {
    mockFetchError(500, 'Internal Server Error')

    const { result } = renderHook(() =>
      useNowPlaying({ endpoint: '/api/now-playing' })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when enabled is false', () => {
    global.fetch = vi.fn()

    renderHook(() =>
      useNowPlaying({ endpoint: '/api/now-playing', enabled: false })
    )

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('refetches on mutate()', async () => {
    const notPlaying: NowPlayingResponse = {
      ...mockNowPlaying,
      isPlaying: false,
    }
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => notPlaying,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockNowPlaying,
      } as Response)

    const { result } = renderHook(() =>
      useNowPlaying({ endpoint: '/api/now-playing' })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.isPlaying).toBe(false)

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.data?.isPlaying).toBe(true))
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('uses a custom fetcher when provided', async () => {
    const customFetcher = vi.fn().mockResolvedValue(mockNowPlaying)

    const { result } = renderHook(() =>
      useNowPlaying({ endpoint: '/api/now-playing', fetcher: customFetcher })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(customFetcher).toHaveBeenCalledWith(
      '/api/now-playing',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
    expect(result.current.data).toEqual(mockNowPlaying)
  })

  it('auto-refreshes at the given interval', async () => {
    vi.useFakeTimers()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNowPlaying,
    } as Response)

    renderHook(() =>
      useNowPlaying({ endpoint: '/api/now-playing', refreshInterval: 5000 })
    )

    // Let initial fetch settle
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Trigger one refresh interval
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000)
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('aborts an in-flight request when unmounted', () => {
    let signal: AbortSignal | undefined
    const fetcher = vi.fn((_url: string, options?: { signal: AbortSignal }) => {
      signal = options?.signal
      return new Promise<NowPlayingResponse>(() => undefined)
    })

    const { unmount } = renderHook(() =>
      useNowPlaying({ endpoint: '/api/now-playing', fetcher })
    )

    unmount()

    expect(signal?.aborted).toBe(true)
  })

  it('aborts and clears loading when disabled during a request', async () => {
    let signal: AbortSignal | undefined
    const fetcher = vi.fn((_url: string, options?: { signal: AbortSignal }) => {
      signal = options?.signal
      return new Promise<NowPlayingResponse>(() => undefined)
    })

    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useNowPlaying({ endpoint: '/api/now-playing', fetcher, enabled }),
      { initialProps: { enabled: true } }
    )

    expect(result.current.isLoading).toBe(true)
    rerender({ enabled: false })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(signal?.aborted).toBe(true)
  })
})

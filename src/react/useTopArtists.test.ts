import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTopArtists } from './useTopArtists'
import type { TopArtistsResponse } from '../core/types'

const mockTopArtists: TopArtistsResponse = {
  artists: [
    {
      name: 'Artist 1',
      url: 'https://open.spotify.com/artist/1',
      image: {
        url: 'https://example.com/artist1.jpg',
        height: 640,
        width: 640,
      },
      followers: 10000,
      genres: ['indie', 'rock'],
    },
    {
      name: 'Artist 2',
      url: 'https://open.spotify.com/artist/2',
      image: undefined,
      followers: 5000,
      genres: ['pop'],
    },
  ],
}

describe('useTopArtists', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in loading state and resolves with data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTopArtists,
    } as Response)

    const { result } = renderHook(() =>
      useTopArtists({ endpoint: '/api/top-artists' })
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(mockTopArtists)
    expect(result.current.error).toBeUndefined()
  })

  it('sets error on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response)

    const { result } = renderHook(() =>
      useTopArtists({ endpoint: '/api/top-artists' })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when enabled is false', () => {
    global.fetch = vi.fn()

    renderHook(() =>
      useTopArtists({ endpoint: '/api/top-artists', enabled: false })
    )

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('refetches on mutate()', async () => {
    const emptyArtists: TopArtistsResponse = { artists: [] }
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => emptyArtists,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopArtists,
      } as Response)

    const { result } = renderHook(() =>
      useTopArtists({ endpoint: '/api/top-artists' })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.artists).toHaveLength(0)

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.data?.artists).toHaveLength(2))
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('uses a custom fetcher when provided', async () => {
    const customFetcher = vi.fn().mockResolvedValue(mockTopArtists)

    const { result } = renderHook(() =>
      useTopArtists({ endpoint: '/api/top-artists', fetcher: customFetcher })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(customFetcher).toHaveBeenCalledWith(
      '/api/top-artists',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
    expect(result.current.data).toEqual(mockTopArtists)
  })

  it('auto-refreshes at the given interval', async () => {
    vi.useFakeTimers()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTopArtists,
    } as Response)

    renderHook(() =>
      useTopArtists({ endpoint: '/api/top-artists', refreshInterval: 5000 })
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
})

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTopTracks } from './useTopTracks'
import type { TopTracksResponse } from '../core/types'

const mockTopTracks: TopTracksResponse = {
  tracks: [
    {
      songUrl: 'https://open.spotify.com/track/1',
      artist: 'Artist 1',
      title: 'Track 1',
      albumArt: { url: 'https://example.com/1.jpg', height: 64, width: 64 },
    },
    {
      songUrl: 'https://open.spotify.com/track/2',
      artist: 'Artist 2',
      title: 'Track 2',
      albumArt: { url: 'https://example.com/2.jpg', height: 64, width: 64 },
    },
  ],
}

describe('useTopTracks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in loading state and resolves with data', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTopTracks,
    } as Response)

    const { result } = renderHook(() =>
      useTopTracks({ endpoint: '/api/top-tracks' })
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toEqual(mockTopTracks)
    expect(result.current.error).toBeUndefined()
  })

  it('sets error on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response)

    const { result } = renderHook(() =>
      useTopTracks({ endpoint: '/api/top-tracks' })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toBeUndefined()
  })

  it('does not fetch when enabled is false', () => {
    global.fetch = vi.fn()

    renderHook(() =>
      useTopTracks({ endpoint: '/api/top-tracks', enabled: false })
    )

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('refetches on mutate()', async () => {
    const emptyTracks: TopTracksResponse = { tracks: [] }
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => emptyTracks,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopTracks,
      } as Response)

    const { result } = renderHook(() =>
      useTopTracks({ endpoint: '/api/top-tracks' })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data?.tracks).toHaveLength(0)

    act(() => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.data?.tracks).toHaveLength(2))
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('uses a custom fetcher when provided', async () => {
    const customFetcher = vi.fn().mockResolvedValue(mockTopTracks)

    const { result } = renderHook(() =>
      useTopTracks({ endpoint: '/api/top-tracks', fetcher: customFetcher })
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(customFetcher).toHaveBeenCalledWith(
      '/api/top-tracks',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
    expect(result.current.data).toEqual(mockTopTracks)
  })

  it('auto-refreshes at the given interval', async () => {
    vi.useFakeTimers()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockTopTracks,
    } as Response)

    renderHook(() =>
      useTopTracks({ endpoint: '/api/top-tracks', refreshInterval: 5000 })
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

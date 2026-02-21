import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpotifyError } from '../core/types'

// Mock SpotifyClient before importing the route factory
vi.mock('../core/SpotifyClient', () => ({
  SpotifyClient: vi.fn().mockImplementation(() => ({
    getNowPlaying: vi.fn(),
  })),
}))

import { createNowPlayingRoute } from './createNowPlayingRoute'
import { SpotifyClient } from '../core/SpotifyClient'

const baseConfig = {
  clientId: 'test-id',
  clientSecret: 'test-secret',
  refreshToken: 'test-token',
}

function getMockClient() {
  return vi.mocked(SpotifyClient).mock.results[
    vi.mocked(SpotifyClient).mock.results.length - 1
  ].value as { getNowPlaying: ReturnType<typeof vi.fn> }
}

describe('createNowPlayingRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with now playing data on success', async () => {
    const mockData = {
      album: 'Test Album',
      albumImageUrl: 'https://example.com/image.jpg',
      artist: 'Test Artist',
      isPlaying: true,
      songUrl: 'https://open.spotify.com/track/123',
      title: 'Test Song',
    }

    const GET = createNowPlayingRoute(baseConfig)
    getMockClient().getNowPlaying.mockResolvedValue(mockData)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(mockData)
  })

  it('returns 200 with Cache-Control header', async () => {
    const GET = createNowPlayingRoute(baseConfig)
    getMockClient().getNowPlaying.mockResolvedValue({ isPlaying: false })

    const response = await GET()

    expect(response.headers.get('Cache-Control')).toBe(
      'public, s-maxage=60, stale-while-revalidate=30'
    )
  })

  it('returns 401 on AUTH_FAILED', async () => {
    const GET = createNowPlayingRoute(baseConfig)
    getMockClient().getNowPlaying.mockRejectedValue(
      new SpotifyError('AUTH_FAILED', 'Token expired')
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Authentication failed')
  })

  it('returns 429 on RATE_LIMITED with Retry-After header', async () => {
    const GET = createNowPlayingRoute(baseConfig)
    getMockClient().getNowPlaying.mockRejectedValue(
      new SpotifyError('RATE_LIMITED', 'Rate limited', 30)
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.retryAfter).toBe(30)
    expect(response.headers.get('Retry-After')).toBe('30')
  })

  it('returns 500 on generic SpotifyError', async () => {
    const GET = createNowPlayingRoute(baseConfig)
    getMockClient().getNowPlaying.mockRejectedValue(
      new SpotifyError('UNKNOWN_ERROR', 'Something went wrong')
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.message).toBe('Something went wrong')
  })

  it('returns 500 on unexpected error', async () => {
    const GET = createNowPlayingRoute(baseConfig)
    getMockClient().getNowPlaying.mockRejectedValue(new Error('Network failure'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.message).toBe('Network failure')
  })
})

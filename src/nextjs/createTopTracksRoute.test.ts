import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpotifyError } from '../core/types'

vi.mock('../core/SpotifyClient', () => ({
  SpotifyClient: vi.fn().mockImplementation(() => ({
    getTopTracks: vi.fn(),
  })),
}))

import { createTopTracksRoute } from './createTopTracksRoute'
import { SpotifyClient } from '../core/SpotifyClient'

const baseConfig = {
  clientId: 'test-id',
  clientSecret: 'test-secret',
  refreshToken: 'test-token',
}

function getMockClient() {
  return vi.mocked(SpotifyClient).mock.results[
    vi.mocked(SpotifyClient).mock.results.length - 1
  ].value as { getTopTracks: ReturnType<typeof vi.fn> }
}

const mockTracks = {
  tracks: [
    {
      songUrl: 'https://open.spotify.com/track/1',
      artist: 'Artist 1',
      title: 'Track 1',
      albumArt: { url: 'https://example.com/1.jpg', height: 64, width: 64 },
    },
  ],
}

describe('createTopTracksRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with top tracks data on success', async () => {
    const GET = createTopTracksRoute(baseConfig)
    getMockClient().getTopTracks.mockResolvedValue(mockTracks)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(mockTracks)
  })

  it('passes limit option to getTopTracks', async () => {
    const GET = createTopTracksRoute({ ...baseConfig, limit: 20 })
    getMockClient().getTopTracks.mockResolvedValue(mockTracks)

    await GET()

    expect(getMockClient().getTopTracks).toHaveBeenCalledWith(20)
  })

  it('defaults limit to 10', async () => {
    const GET = createTopTracksRoute(baseConfig)
    getMockClient().getTopTracks.mockResolvedValue(mockTracks)

    await GET()

    expect(getMockClient().getTopTracks).toHaveBeenCalledWith(10)
  })

  it('returns 401 on AUTH_FAILED', async () => {
    const GET = createTopTracksRoute(baseConfig)
    getMockClient().getTopTracks.mockRejectedValue(
      new SpotifyError('AUTH_FAILED', 'Token expired')
    )

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns 429 on RATE_LIMITED with Retry-After header', async () => {
    const GET = createTopTracksRoute(baseConfig)
    getMockClient().getTopTracks.mockRejectedValue(
      new SpotifyError('RATE_LIMITED', 'Rate limited', 60)
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.retryAfter).toBe(60)
    expect(response.headers.get('Retry-After')).toBe('60')
  })

  it('returns 500 on generic error', async () => {
    const GET = createTopTracksRoute(baseConfig)
    getMockClient().getTopTracks.mockRejectedValue(
      new SpotifyError('UNKNOWN_ERROR', 'Something went wrong')
    )

    const response = await GET()
    expect(response.status).toBe(500)
  })
})

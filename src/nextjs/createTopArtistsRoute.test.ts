import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpotifyError } from '../core/types'

vi.mock('../core/SpotifyClient', () => ({
  SpotifyClient: vi.fn().mockImplementation(() => ({
    getTopArtists: vi.fn(),
  })),
}))

import { createTopArtistsRoute } from './createTopArtistsRoute'
import { SpotifyClient } from '../core/SpotifyClient'

const baseConfig = {
  clientId: 'test-id',
  clientSecret: 'test-secret',
  refreshToken: 'test-token',
}

function getMockClient() {
  return vi.mocked(SpotifyClient).mock.results[
    vi.mocked(SpotifyClient).mock.results.length - 1
  ].value as { getTopArtists: ReturnType<typeof vi.fn> }
}

const mockArtists = {
  artists: [
    {
      name: 'Artist 1',
      url: 'https://open.spotify.com/artist/1',
      image: { url: 'https://example.com/artist1.jpg', height: 640, width: 640 },
      followers: 10000,
      genres: ['indie'],
    },
  ],
}

describe('createTopArtistsRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with top artists data on success', async () => {
    const GET = createTopArtistsRoute(baseConfig)
    getMockClient().getTopArtists.mockResolvedValue(mockArtists)

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual(mockArtists)
  })

  it('passes limit option to getTopArtists', async () => {
    const GET = createTopArtistsRoute({ ...baseConfig, limit: 25 })
    getMockClient().getTopArtists.mockResolvedValue(mockArtists)

    await GET()

    expect(getMockClient().getTopArtists).toHaveBeenCalledWith(25)
  })

  it('defaults limit to 10', async () => {
    const GET = createTopArtistsRoute(baseConfig)
    getMockClient().getTopArtists.mockResolvedValue(mockArtists)

    await GET()

    expect(getMockClient().getTopArtists).toHaveBeenCalledWith(10)
  })

  it('returns 401 on AUTH_FAILED', async () => {
    const GET = createTopArtistsRoute(baseConfig)
    getMockClient().getTopArtists.mockRejectedValue(
      new SpotifyError('AUTH_FAILED', 'Token expired')
    )

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns 429 on RATE_LIMITED with Retry-After header', async () => {
    const GET = createTopArtistsRoute(baseConfig)
    getMockClient().getTopArtists.mockRejectedValue(
      new SpotifyError('RATE_LIMITED', 'Rate limited', 45)
    )

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(429)
    expect(body.retryAfter).toBe(45)
    expect(response.headers.get('Retry-After')).toBe('45')
  })

  it('returns 500 on generic error', async () => {
    const GET = createTopArtistsRoute(baseConfig)
    getMockClient().getTopArtists.mockRejectedValue(new Error('Unexpected'))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.message).toBe('Unexpected')
  })
})

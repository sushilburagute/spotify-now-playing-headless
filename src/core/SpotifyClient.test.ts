import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SpotifyClient } from './SpotifyClient'
import { SpotifyError } from './types'
import type { SpotifyConfig } from './types'

// Mock fetch globally
global.fetch = vi.fn()

describe('SpotifyClient', () => {
  let config: SpotifyConfig

  beforeEach(() => {
    config = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      refreshToken: 'test-refresh-token',
    }
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create a client with valid config', () => {
      expect(() => new SpotifyClient(config)).not.toThrow()
    })

    it('should throw error if clientId is missing', () => {
      const invalidConfig = { ...config, clientId: '' }
      expect(() => new SpotifyClient(invalidConfig)).toThrow(
        'Spotify clientId is required'
      )
    })

    it('should throw error if clientSecret is missing', () => {
      const invalidConfig = { ...config, clientSecret: '' }
      expect(() => new SpotifyClient(invalidConfig)).toThrow(
        'Spotify clientSecret is required'
      )
    })

    it('should throw error if refreshToken is missing', () => {
      const invalidConfig = { ...config, refreshToken: '' }
      expect(() => new SpotifyClient(invalidConfig)).toThrow(
        'Spotify refreshToken is required'
      )
    })

    it('should accept custom endpoints', () => {
      const customConfig = {
        ...config,
        endpoints: {
          nowPlaying: 'https://custom.api/now-playing',
        },
      }
      expect(() => new SpotifyClient(customConfig)).not.toThrow()
    })
  })

  describe('SpotifyError', () => {
    it('should be an instance of Error', () => {
      const err = new SpotifyError('AUTH_FAILED', 'test message')
      expect(err).toBeInstanceOf(Error)
      expect(err).toBeInstanceOf(SpotifyError)
      expect(err.code).toBe('AUTH_FAILED')
      expect(err.message).toBe('test message')
      expect(err.name).toBe('SpotifyError')
    })

    it('should carry retryAfter and originalError', () => {
      const cause = new Error('original')
      const err = new SpotifyError('RATE_LIMITED', 'rate limited', 30, cause)
      expect(err.retryAfter).toBe(30)
      expect(err.originalError).toBe(cause)
    })
  })

  describe('getNowPlaying', () => {
    it('should return now playing data when track is playing', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token' }),
      })

      // Mock now playing response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          is_playing: true,
          item: {
            name: 'Test Song',
            artists: [{ name: 'Test Artist' }],
            album: {
              name: 'Test Album',
              images: [{ url: 'https://test.com/image.jpg', height: 640, width: 640 }],
            },
            external_urls: {
              spotify: 'https://open.spotify.com/track/123',
            },
          },
        }),
      })

      const client = new SpotifyClient(config)
      const result = await client.getNowPlaying()

      expect(result).toEqual({
        album: 'Test Album',
        albumImageUrl: 'https://test.com/image.jpg',
        artist: 'Test Artist',
        isPlaying: true,
        songUrl: 'https://open.spotify.com/track/123',
        title: 'Test Song',
      })
    })

    it('should return isPlaying: false when nothing is playing (204)', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token' }),
      })

      // Mock 204 No Content response
      mockFetch.mockResolvedValueOnce({
        status: 204,
      })

      const client = new SpotifyClient(config)
      const result = await client.getNowPlaying()

      expect(result.isPlaying).toBe(false)
    })

    it('should return isPlaying: false when item is null', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token' }),
      })

      // Mock now playing response with null item
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          is_playing: false,
          item: null,
        }),
      })

      const client = new SpotifyClient(config)
      const result = await client.getNowPlaying()

      expect(result.isPlaying).toBe(false)
    })

    it('should handle rate limiting (429)', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token' }),
      })

      // Mock 429 rate limit response
      mockFetch.mockResolvedValueOnce({
        status: 429,
        headers: new Map([['Retry-After', '60']]),
        get: (key: string) => (key === 'Retry-After' ? '60' : null),
      })

      const client = new SpotifyClient(config)

      await expect(client.getNowPlaying()).rejects.toMatchObject({
        code: 'RATE_LIMITED',
        retryAfter: 60,
      })
    })

    it('should handle auth failure', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock failed token response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      })

      const client = new SpotifyClient(config)

      await expect(client.getNowPlaying()).rejects.toMatchObject({
        code: 'AUTH_FAILED',
      })
    })
  })

  describe('getTopTracks', () => {
    it('should return top tracks', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token' }),
      })

      // Mock top tracks response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              name: 'Track 1',
              artists: [{ name: 'Artist 1' }],
              external_urls: { spotify: 'https://open.spotify.com/track/1' },
              album: {
                images: [
                  { url: 'https://test.com/1.jpg', height: 640, width: 640 },
                  { url: 'https://test.com/1-medium.jpg', height: 300, width: 300 },
                  { url: 'https://test.com/1-small.jpg', height: 64, width: 64 },
                ],
              },
            },
          ],
        }),
      })

      const client = new SpotifyClient(config)
      const result = await client.getTopTracks(1)

      expect(result.tracks).toHaveLength(1)
      expect(result.tracks[0]).toEqual({
        songUrl: 'https://open.spotify.com/track/1',
        artist: 'Artist 1',
        title: 'Track 1',
        albumArt: {
          url: 'https://test.com/1-small.jpg',
          height: 64,
          width: 64,
        },
      })
    })

    it('should respect limit parameter (max 50)', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token' }),
      })

      // Mock top tracks response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ items: [] }),
      })

      const client = new SpotifyClient(config)
      await client.getTopTracks(100) // Request 100, should cap at 50

      const url = mockFetch.mock.calls[1][0]
      expect(url).toContain('limit=50')
    })
  })

  describe('getTopArtists', () => {
    it('should return top artists', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token' }),
      })

      // Mock top artists response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              name: 'Artist 1',
              external_urls: { spotify: 'https://open.spotify.com/artist/1' },
              images: [{ url: 'https://test.com/artist1.jpg', height: 640, width: 640 }],
              followers: { total: 1000 },
              genres: ['rock', 'indie'],
            },
          ],
        }),
      })

      const client = new SpotifyClient(config)
      const result = await client.getTopArtists(1)

      expect(result.artists).toHaveLength(1)
      expect(result.artists[0]).toEqual({
        name: 'Artist 1',
        url: 'https://open.spotify.com/artist/1',
        image: {
          url: 'https://test.com/artist1.jpg',
          height: 640,
          width: 640,
        },
        followers: 1000,
        genres: ['rock', 'indie'],
      })
    })

    it('should handle artists without images', async () => {
      const mockFetch = vi.fn()
      global.fetch = mockFetch

      // Mock token response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'test-access-token' }),
      })

      // Mock top artists response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              name: 'Artist Without Image',
              external_urls: { spotify: 'https://open.spotify.com/artist/2' },
              images: [],
            },
          ],
        }),
      })

      const client = new SpotifyClient(config)
      const result = await client.getTopArtists(1)

      expect(result.artists[0].image).toBeUndefined()
    })
  })
})

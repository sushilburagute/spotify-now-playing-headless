import { SpotifyError } from './types'
import type {
  SpotifyConfig,
  SpotifyTokenResponse,
  NowPlayingResponse,
  TopTracksResponse,
  TopArtistsResponse,
  SpotifyNowPlayingApiResponse,
  SpotifyTrackObject,
  SpotifyArtistObject,
} from './types'

/**
 * Default Spotify API endpoints
 */
const DEFAULT_ENDPOINTS = {
  nowPlaying: 'https://api.spotify.com/v1/me/player/currently-playing',
  topTracks: 'https://api.spotify.com/v1/me/top/tracks',
  topArtists: 'https://api.spotify.com/v1/me/top/artists',
  token: 'https://accounts.spotify.com/api/token',
}

/**
 * Internal config type with all endpoints defined
 * @internal
 */
type InternalSpotifyConfig = Omit<SpotifyConfig, 'endpoints'> & {
  endpoints: typeof DEFAULT_ENDPOINTS
}

/**
 * Spotify API client for fetching Now Playing, Top Tracks, and Top Artists
 *
 * @example
 * ```typescript
 * const spotify = new SpotifyClient({
 *   clientId: process.env.SPOTIFY_CLIENT_ID!,
 *   clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
 *   refreshToken: process.env.SPOTIFY_REFRESH_TOKEN!,
 * })
 *
 * const nowPlaying = await spotify.getNowPlaying()
 * ```
 */
export class SpotifyClient {
  private config: InternalSpotifyConfig
  private basicAuth: string

  /**
   * Create a new Spotify API client
   *
   * @param config - Spotify API configuration with credentials
   * @throws {Error} If required configuration is missing
   */
  constructor(config: SpotifyConfig) {
    this.validateConfig(config)

    this.config = {
      ...config,
      endpoints: {
        ...DEFAULT_ENDPOINTS,
        ...config.endpoints,
      },
    }

    // btoa() is available in all modern browsers and Node.js ≥ 16,
    // and works in Edge Runtime / Cloudflare Workers (unlike Buffer).
    this.basicAuth = btoa(`${config.clientId}:${config.clientSecret}`)
  }

  /**
   * Validate the Spotify configuration
   * @private
   */
  private validateConfig(config: SpotifyConfig): void {
    if (!config.clientId) {
      throw new Error('Spotify clientId is required')
    }
    if (!config.clientSecret) {
      throw new Error('Spotify clientSecret is required')
    }
    if (!config.refreshToken) {
      throw new Error('Spotify refreshToken is required')
    }
  }

  /**
   * Get a fresh Spotify access token using the refresh token
   * @private
   * @throws {SpotifyError} If token refresh fails
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(this.config.endpoints.token, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.config.refreshToken,
        }).toString(),
      })

      if (!response.ok) {
        throw new SpotifyError(
          'AUTH_FAILED',
          `Failed to refresh Spotify token: ${response.status} ${response.statusText}`,
        )
      }

      const data: SpotifyTokenResponse = await response.json()
      return data.access_token
    } catch (err) {
      if (err instanceof SpotifyError) {
        throw err
      }
      throw new SpotifyError(
        'NETWORK_ERROR',
        'Failed to fetch Spotify access token',
        undefined,
        err,
      )
    }
  }

  /**
   * Fetch the currently playing track from Spotify
   *
   * @returns Promise resolving to the now playing track data, or isPlaying: false if nothing is playing
   * @throws {SpotifyError} If the API request fails
   *
   * @example
   * ```typescript
   * const nowPlaying = await spotify.getNowPlaying()
   * if (nowPlaying.isPlaying) {
   *   console.log(`Now playing: ${nowPlaying.title} by ${nowPlaying.artist}`)
   * }
   * ```
   */
  async getNowPlaying(): Promise<NowPlayingResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const response = await fetch(this.config.endpoints.nowPlaying, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      // 204 = No content (nothing playing)
      if (response.status === 204) {
        return {
          album: '',
          albumImageUrl: '',
          artist: '',
          isPlaying: false,
          songUrl: '',
          title: '',
        }
      }

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new SpotifyError(
          'RATE_LIMITED',
          'Spotify API rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : undefined,
        )
      }

      if (!response.ok) {
        throw new SpotifyError(
          'NETWORK_ERROR',
          `Spotify API error: ${response.status} ${response.statusText}`,
        )
      }

      const song: SpotifyNowPlayingApiResponse = await response.json()

      // Handle case where item is null
      if (!song.item) {
        return {
          album: '',
          albumImageUrl: '',
          artist: '',
          isPlaying: false,
          songUrl: '',
          title: '',
        }
      }

      return {
        album: song.item.album.name,
        albumImageUrl: song.item.album.images[0]?.url ?? '',
        artist: song.item.artists.map((artist) => artist.name).join(', '),
        isPlaying: song.is_playing,
        songUrl: song.item.external_urls.spotify,
        title: song.item.name,
      }
    } catch (err) {
      if (err instanceof SpotifyError) {
        throw err
      }
      throw new SpotifyError(
        'UNKNOWN_ERROR',
        'Failed to fetch now playing',
        undefined,
        err,
      )
    }
  }

  /**
   * Fetch the user's top tracks from Spotify
   *
   * @param limit - Number of tracks to fetch (default: 10, max: 50)
   * @returns Promise resolving to the top tracks data
   * @throws {SpotifyError} If the API request fails
   *
   * @example
   * ```typescript
   * const topTracks = await spotify.getTopTracks(10)
   * console.log(`Top tracks: ${topTracks.tracks.length}`)
   * ```
   */
  async getTopTracks(limit: number = 10): Promise<TopTracksResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const url = new URL(this.config.endpoints.topTracks)
      url.searchParams.set('limit', Math.min(limit, 50).toString())

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new SpotifyError(
          'RATE_LIMITED',
          'Spotify API rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : undefined,
        )
      }

      if (!response.ok) {
        throw new SpotifyError(
          'NETWORK_ERROR',
          `Spotify API error: ${response.status} ${response.statusText}`,
        )
      }

      const data: { items: SpotifyTrackObject[] } = await response.json()

      return {
        tracks: data.items.map((track) => ({
          songUrl: track.external_urls.spotify,
          artist: track.artists.map((artist) => artist.name).join(', '),
          title: track.name,
          albumArt: {
            url: track.album.images[2]?.url ?? track.album.images[0]?.url ?? '',
            height: track.album.images[2]?.height ?? 64,
            width: track.album.images[2]?.width ?? 64,
          },
        })),
      }
    } catch (err) {
      if (err instanceof SpotifyError) {
        throw err
      }
      throw new SpotifyError(
        'UNKNOWN_ERROR',
        'Failed to fetch top tracks',
        undefined,
        err,
      )
    }
  }

  /**
   * Fetch the user's top artists from Spotify
   *
   * @param limit - Number of artists to fetch (default: 10, max: 50)
   * @returns Promise resolving to the top artists data
   * @throws {SpotifyError} If the API request fails
   *
   * @example
   * ```typescript
   * const topArtists = await spotify.getTopArtists(10)
   * console.log(`Top artists: ${topArtists.artists.length}`)
   * ```
   */
  async getTopArtists(limit: number = 10): Promise<TopArtistsResponse> {
    try {
      const accessToken = await this.getAccessToken()

      const url = new URL(this.config.endpoints.topArtists)
      url.searchParams.set('limit', Math.min(limit, 50).toString())

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new SpotifyError(
          'RATE_LIMITED',
          'Spotify API rate limit exceeded',
          retryAfter ? parseInt(retryAfter, 10) : undefined,
        )
      }

      if (!response.ok) {
        throw new SpotifyError(
          'NETWORK_ERROR',
          `Spotify API error: ${response.status} ${response.statusText}`,
        )
      }

      const data: { items: SpotifyArtistObject[] } = await response.json()

      return {
        artists: data.items.map((artist) => ({
          name: artist.name,
          url: artist.external_urls.spotify,
          image: artist.images?.[0]
            ? {
                url: artist.images[0].url,
                height: artist.images[0].height,
                width: artist.images[0].width,
              }
            : undefined,
          followers: artist.followers?.total,
          genres: artist.genres,
        })),
      }
    } catch (err) {
      if (err instanceof SpotifyError) {
        throw err
      }
      throw new SpotifyError(
        'UNKNOWN_ERROR',
        'Failed to fetch top artists',
        undefined,
        err,
      )
    }
  }
}

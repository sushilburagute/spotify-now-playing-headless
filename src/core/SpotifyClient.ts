import { SpotifyError } from './types'
import type {
  SpotifyConfig,
  SpotifyTokenResponse,
  NowPlayingResponse,
  TopTracksResponse,
  TopArtistsResponse,
  SpotifyNowPlayingApiResponse,
  SpotifyTrackObject,
  SpotifyEpisodeObject,
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

type CachedAccessToken = {
  value: string
  expiresAt: number
}

const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 30_000

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
  private accessToken?: CachedAccessToken
  private accessTokenPromise?: Promise<string>

  /**
   * Create a new Spotify API client
   *
   * @param config - Spotify API configuration with credentials
   * @throws {SpotifyError} If required configuration is missing
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

    // btoa() is available in all modern browsers and Node.js >= 16,
    // and works in Edge Runtime / Cloudflare Workers (unlike Buffer).
    this.basicAuth = btoa(`${config.clientId}:${config.clientSecret}`)
  }

  /**
   * Validate the Spotify configuration
   * @private
   */
  private validateConfig(config: SpotifyConfig): void {
    if (!config.clientId) {
      throw new SpotifyError('INVALID_CONFIG', 'Spotify clientId is required')
    }
    if (!config.clientSecret) {
      throw new SpotifyError(
        'INVALID_CONFIG',
        'Spotify clientSecret is required'
      )
    }
    if (!config.refreshToken) {
      throw new SpotifyError(
        'INVALID_CONFIG',
        'Spotify refreshToken is required'
      )
    }
  }

  /**
   * Get a fresh Spotify access token using the refresh token
   * @private
   * @throws {SpotifyError} If token refresh fails
   */
  private async getAccessToken(): Promise<string> {
    if (
      this.accessToken &&
      Date.now() < this.accessToken.expiresAt - ACCESS_TOKEN_EXPIRY_BUFFER_MS
    ) {
      return this.accessToken.value
    }

    if (this.accessTokenPromise) {
      return this.accessTokenPromise
    }

    this.accessTokenPromise = this.refreshAccessToken()

    try {
      return await this.accessTokenPromise
    } finally {
      this.accessTokenPromise = undefined
    }
  }

  /**
   * Exchange the configured refresh token for an access token.
   * @private
   */
  private async refreshAccessToken(): Promise<string> {
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

      if (response.status === 429) {
        const retryAfter = this.getRetryAfter(response)
        throw new SpotifyError(
          'RATE_LIMITED',
          'Spotify token endpoint rate limit exceeded',
          retryAfter
        )
      }

      if (!response.ok) {
        const code =
          response.status === 400 ||
          response.status === 401 ||
          response.status === 403
            ? 'AUTH_FAILED'
            : 'NETWORK_ERROR'
        throw new SpotifyError(
          code,
          `Failed to refresh Spotify token: ${response.status} ${response.statusText}`
        )
      }

      const data: SpotifyTokenResponse = await response.json()

      if (!data.access_token || !Number.isFinite(data.expires_in)) {
        throw new SpotifyError(
          'AUTH_FAILED',
          'Spotify token response was missing required fields'
        )
      }

      this.accessToken = {
        value: data.access_token,
        expiresAt: Date.now() + Math.max(data.expires_in, 0) * 1000,
      }

      if (
        data.refresh_token &&
        data.refresh_token !== this.config.refreshToken
      ) {
        this.config.refreshToken = data.refresh_token

        try {
          await this.config.onRefreshToken?.(data.refresh_token)
        } catch (err) {
          this.accessToken = undefined
          throw new SpotifyError(
            'UNKNOWN_ERROR',
            'Failed to persist the rotated Spotify refresh token',
            undefined,
            err
          )
        }
      }

      return data.access_token
    } catch (err) {
      if (err instanceof SpotifyError) {
        throw err
      }
      throw new SpotifyError(
        'NETWORK_ERROR',
        'Failed to fetch Spotify access token',
        undefined,
        err
      )
    }
  }

  /**
   * Fetch a Spotify API resource, retrying once with a fresh token on 401.
   * @private
   */
  private async fetchSpotify(url: string): Promise<Response> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const accessToken = await this.getAccessToken()
      let response: Response

      try {
        response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      } catch (err) {
        throw new SpotifyError(
          'NETWORK_ERROR',
          'Failed to reach the Spotify API',
          undefined,
          err
        )
      }

      if (response.status === 401 && attempt === 0) {
        this.accessToken = undefined
        continue
      }

      if (response.status === 401 || response.status === 403) {
        throw new SpotifyError(
          'AUTH_FAILED',
          `Spotify API authorization failed: ${response.status} ${response.statusText}`
        )
      }

      if (response.status === 429) {
        throw new SpotifyError(
          'RATE_LIMITED',
          'Spotify API rate limit exceeded',
          this.getRetryAfter(response)
        )
      }

      if (!response.ok && response.status !== 204) {
        throw new SpotifyError(
          'NETWORK_ERROR',
          `Spotify API error: ${response.status} ${response.statusText}`
        )
      }

      return response
    }

    throw new SpotifyError('AUTH_FAILED', 'Spotify API authorization failed')
  }

  /** @private */
  private getRetryAfter(response: Response): number | undefined {
    const value = response.headers.get('Retry-After')
    if (!value) return undefined

    const seconds = Number.parseInt(value, 10)
    return Number.isFinite(seconds) ? seconds : undefined
  }

  /** @private */
  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit)) return 10
    return Math.min(Math.max(Math.trunc(limit), 1), 50)
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
      const response = await this.fetchSpotify(this.config.endpoints.nowPlaying)

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

      return this.mapNowPlayingItem(song.item, song.is_playing)
    } catch (err) {
      if (err instanceof SpotifyError) {
        throw err
      }
      throw new SpotifyError(
        'UNKNOWN_ERROR',
        'Failed to fetch now playing',
        undefined,
        err
      )
    }
  }

  /** @private */
  private mapNowPlayingItem(
    item: SpotifyTrackObject | SpotifyEpisodeObject,
    isPlaying: boolean
  ): NowPlayingResponse {
    if (item.type === 'episode') {
      return {
        album: item.show.name,
        albumImageUrl: item.images[0]?.url ?? '',
        artist: item.show.name,
        isPlaying,
        songUrl: item.external_urls.spotify,
        title: item.name,
      }
    }

    return {
      album: item.album.name ?? '',
      albumImageUrl: item.album.images[0]?.url ?? '',
      artist: item.artists.map((artist) => artist.name).join(', '),
      isPlaying,
      songUrl: item.external_urls.spotify,
      title: item.name,
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
      const url = new URL(this.config.endpoints.topTracks)
      url.searchParams.set('limit', this.normalizeLimit(limit).toString())

      const response = await this.fetchSpotify(url.toString())

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
        err
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
      const url = new URL(this.config.endpoints.topArtists)
      url.searchParams.set('limit', this.normalizeLimit(limit).toString())

      const response = await this.fetchSpotify(url.toString())

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
        err
      )
    }
  }
}

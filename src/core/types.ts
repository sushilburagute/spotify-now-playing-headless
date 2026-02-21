/**
 * Configuration for the Spotify API client
 */
export type SpotifyConfig = {
  /** Spotify Client ID from Spotify Developer Dashboard */
  clientId: string
  /** Spotify Client Secret from Spotify Developer Dashboard */
  clientSecret: string
  /** Spotify Refresh Token obtained through OAuth flow */
  refreshToken: string
  /** Optional endpoint overrides for custom Spotify API instances */
  endpoints?: {
    nowPlaying?: string
    topTracks?: string
    topArtists?: string
    token?: string
  }
}

/**
 * Album artwork information
 */
export type AlbumArt = {
  height: number
  width: number
  url: string
}

/**
 * A single song/track
 */
export type Song = {
  songUrl: string
  artist: string
  title: string
  albumArt: AlbumArt
}

/**
 * Response from the Now Playing API
 */
export type NowPlayingResponse = {
  /** Name of the album */
  album: string
  /** URL to the album cover image */
  albumImageUrl: string
  /** Comma-separated list of artists */
  artist: string
  /** Whether a track is currently playing */
  isPlaying: boolean
  /** Spotify URL to the track */
  songUrl: string
  /** Title of the track */
  title: string
}

/**
 * Response from the Top Tracks API
 */
export type TopTracksResponse = {
  tracks: Song[]
}

/**
 * A single artist with image
 */
export type Artist = {
  name: string
  url: string
  image?: {
    url: string
    height: number
    width: number
  }
  followers?: number
  genres?: string[]
}

/**
 * Response from the Top Artists API
 */
export type TopArtistsResponse = {
  artists: Artist[]
}

/**
 * Spotify API error codes
 */
export type SpotifyErrorCode =
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'RATE_LIMITED'
  | 'NOT_PLAYING'
  | 'INVALID_CONFIG'
  | 'UNKNOWN_ERROR'

/**
 * Spotify API error with structured information.
 * Extends `Error` so it satisfies `instanceof Error` and carries a stack trace.
 */
export class SpotifyError extends Error {
  constructor(
    public readonly code: SpotifyErrorCode,
    message: string,
    public readonly retryAfter?: number,
    public readonly originalError?: unknown,
  ) {
    super(message)
    this.name = 'SpotifyError'
    // Restore prototype chain so instanceof works after transpilation
    Object.setPrototypeOf(this, SpotifyError.prototype)
  }
}

/**
 * Internal Spotify token response
 * @internal
 */
export type SpotifyTokenResponse = {
  access_token: string
  token_type: string
  expires_in: number
  scope?: string
}

/**
 * Raw Spotify API now playing response
 * @internal
 */
export type SpotifyNowPlayingApiResponse = {
  is_playing: boolean
  item: {
    name: string
    artists: Array<{ name: string }>
    album: {
      name: string
      images: Array<{ url: string; height: number; width: number }>
    }
    external_urls: {
      spotify: string
    }
  } | null
}

/**
 * Raw Spotify API track object
 * @internal
 */
export type SpotifyTrackObject = {
  name: string
  artists: Array<{ name: string }>
  external_urls: {
    spotify: string
  }
  album: {
    images: Array<{ url: string; height: number; width: number }>
  }
}

/**
 * Raw Spotify API artist object
 * @internal
 */
export type SpotifyArtistObject = {
  name: string
  external_urls: {
    spotify: string
  }
  images?: Array<{ url: string; height: number; width: number }>
  followers?: {
    total: number
  }
  genres?: string[]
}

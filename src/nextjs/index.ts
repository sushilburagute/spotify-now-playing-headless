/**
 * Next.js API route factories for Spotify integration
 * @packageDocumentation
 */

export {
  createNowPlayingRoute,
  type CreateNowPlayingRouteOptions,
} from './createNowPlayingRoute'

export {
  createTopTracksRoute,
  type CreateTopTracksRouteOptions,
} from './createTopTracksRoute'

export {
  createTopArtistsRoute,
  type CreateTopArtistsRouteOptions,
} from './createTopArtistsRoute'

export type { SpotifyRouteOptions } from './routeUtils'

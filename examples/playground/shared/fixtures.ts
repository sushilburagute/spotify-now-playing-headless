import type {
  NowPlayingResponse,
  TopArtistsResponse,
  TopTracksResponse,
} from 'spotify-now-playing-headless/core'

function artwork(first: string, second: string, accent: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${first}"/><stop offset="1" stop-color="${second}"/></linearGradient><radialGradient id="r"><stop stop-color="${accent}" stop-opacity=".88"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation="25"/></filter></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="480" cy="100" r="260" fill="url(#r)" filter="url(#b)"/><circle cx="200" cy="420" r="215" fill="none" stroke="white" stroke-opacity=".42" stroke-width="2"/><circle cx="200" cy="420" r="160" fill="none" stroke="white" stroke-opacity=".3" stroke-width="2"/><circle cx="200" cy="420" r="105" fill="none" stroke="white" stroke-opacity=".28" stroke-width="2"/><circle cx="200" cy="420" r="49" fill="white" fill-opacity=".7"/><path d="M-30 180C100 100 215 160 320 245s210 85 340-15" fill="none" stroke="white" stroke-opacity=".32" stroke-width="2"/><path d="M-30 203C100 123 215 183 320 268s210 85 340-15" fill="none" stroke="white" stroke-opacity=".2" stroke-width="2"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const covers = {
  orbit: artwork('#553d7d', '#121826', '#f9a7b9'),
  blue: artwork('#163968', '#0b122c', '#8ae2fd'),
  amber: artwork('#84513e', '#211b2e', '#f7bf76'),
  green: artwork('#1d675d', '#121e31', '#b9edbd'),
}

export const nowPlaying: NowPlayingResponse = {
  album: 'Soft Signals',
  albumImageUrl: covers.orbit,
  artist: 'Aria Vale',
  isPlaying: true,
  songUrl: '#demo-track',
  title: 'Afterglow Circuit',
}

export const pausedPlaying: NowPlayingResponse = {
  ...nowPlaying,
  isPlaying: false,
}

export const topTracks: TopTracksResponse = {
  tracks: [
    {
      title: 'Night Transit',
      artist: 'Milo June',
      songUrl: '#night-transit',
      albumArt: { url: covers.blue, width: 600, height: 600 },
    },
    {
      title: 'Golden Hourglass',
      artist: 'The Stillwater',
      songUrl: '#golden-hourglass',
      albumArt: { url: covers.amber, width: 600, height: 600 },
    },
    {
      title: 'Almost Home',
      artist: 'Aria Vale',
      songUrl: '#almost-home',
      albumArt: { url: covers.green, width: 600, height: 600 },
    },
  ],
}

export const topArtists: TopArtistsResponse = {
  artists: [
    {
      name: 'Aria Vale',
      url: '#aria-vale',
      image: { url: covers.orbit, width: 600, height: 600 },
      genres: ['dream pop', 'electronic'],
    },
    {
      name: 'Milo June',
      url: '#milo-june',
      image: { url: covers.blue, width: 600, height: 600 },
      genres: ['indie electronic'],
    },
    {
      name: 'The Stillwater',
      url: '#the-stillwater',
      image: { url: covers.amber, width: 600, height: 600 },
      genres: ['ambient'],
    },
  ],
}

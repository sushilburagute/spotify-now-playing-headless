import 'dotenv/config'

import { createServer } from 'node:http'
import { SpotifyClient, SpotifyError } from 'spotify-now-playing-headless/core'

const client = new SpotifyClient({
  clientId: requiredEnv('SPOTIFY_CLIENT_ID'),
  clientSecret: requiredEnv('SPOTIFY_CLIENT_SECRET'),
  refreshToken: requiredEnv('SPOTIFY_REFRESH_TOKEN'),
  onRefreshToken: (refreshToken) => {
    // Persist this value in your secrets manager for the next deployment.
    console.warn('Spotify rotated the refresh token', refreshToken.length)
  },
})

createServer(async (request, response) => {
  if (request.method !== 'GET' || request.url !== '/api/now-playing') {
    response.writeHead(404).end()
    return
  }

  try {
    const data = await client.getNowPlaying()
    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=15',
    })
    response.end(JSON.stringify(data))
  } catch (error) {
    const status =
      error instanceof SpotifyError && error.code === 'RATE_LIMITED' ? 429 : 500
    response.writeHead(status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify({ error: 'Spotify request failed' }))
  }
}).listen(8787, '127.0.0.1', () => {
  console.log('Spotify API server listening on http://127.0.0.1:8787')
})

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

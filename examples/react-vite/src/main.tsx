import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { useNowPlaying } from 'spotify-now-playing-headless/react'

function App() {
  const { data, error, isLoading } = useNowPlaying({
    endpoint: '/api/now-playing',
    refreshInterval: 30_000,
  })

  if (isLoading && !data) return <main>Loading…</main>
  if (error) return <main>Could not load Spotify: {error.message}</main>
  if (!data?.isPlaying) return <main>Nothing is playing.</main>

  return (
    <main>
      <img src={data.albumImageUrl} alt={data.album} width={160} height={160} />
      <h1>{data.title}</h1>
      <p>{data.artist}</p>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

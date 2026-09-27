import type { Metadata } from 'next'
import { Playground } from '../../shared/Playground'

export const metadata: Metadata = {
  title: 'Next.js Spotify Playground',
  description:
    'Explore Spotify Now Playing, Top Tracks, and Top Artists hooks in a Next.js playground with fictional data and interactive UI states.',
  alternates: { canonical: '/next/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Spotify Now Playing Headless',
    title: 'Next.js Spotify Playground | Spotify Now Playing Headless',
    description:
      'Explore Spotify Now Playing, Top Tracks, and Top Artists hooks in a Next.js playground with fictional data and interactive UI states.',
    url: '/next/',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Spotify Now Playing Headless playground',
      },
    ],
  },
}

export default function NextPlayground() {
  return <Playground framework="next" />
}

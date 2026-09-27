import type { Metadata } from 'next'
import { Landing } from '../shared/Landing'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Spotify Now Playing Headless',
    title: 'Spotify Now Playing Headless — Interactive Playground',
    description:
      'Explore a headless Spotify package through interactive React and Next.js demos. Fictional music, real hooks.',
    url: '/',
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

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      name: 'Spotify Now Playing Headless Playground',
      url: 'https://headless-spotify.sush.dev/',
      author: { '@id': 'https://headless-spotify.sush.dev/#author' },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'spotify-now-playing-headless',
      description:
        'A headless TypeScript package for Spotify Now Playing, Top Tracks, and Top Artists in React and Next.js.',
      url: 'https://headless-spotify.sush.dev/',
      codeRepository:
        'https://github.com/sushilburagute/spotify-now-playing-headless',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Web',
      author: { '@id': 'https://headless-spotify.sush.dev/#author' },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    },
    {
      '@type': 'Person',
      '@id': 'https://headless-spotify.sush.dev/#author',
      name: 'Sushil Buragute',
      url: 'https://sush.dev/',
      sameAs: ['https://github.com/sushilburagute'],
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Landing />
    </>
  )
}

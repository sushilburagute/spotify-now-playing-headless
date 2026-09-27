import type { Metadata } from 'next'
import '@fontsource-variable/space-grotesk/wght.css'
import '../shared/styles.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://headless-spotify.sush.dev'),
  title: {
    default: 'Spotify Now Playing Headless — Interactive Playground',
    template: '%s | Spotify Now Playing Headless',
  },
  description:
    'See Spotify Now Playing, Top Tracks, and Top Artists hooks in action. Explore matching React and Next.js demos with fictional data. Made by Sushil Buragute.',
  applicationName: 'Spotify Now Playing Headless',
  authors: [{ name: 'Sushil Buragute', url: 'https://sush.dev/' }],
  creator: 'Sushil Buragute',
  publisher: 'Sushil Buragute',
  keywords: [
    'Spotify Now Playing React',
    'Spotify Next.js integration',
    'headless Spotify hooks',
    'Spotify top tracks',
    'Spotify top artists',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Spotify Now Playing Headless',
    title: 'Spotify Now Playing Headless — Interactive Playground',
    description:
      'Explore a headless Spotify package through interactive React and Next.js demos. Fictional music, real hooks.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Spotify Now Playing Headless playground',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spotify Now Playing Headless — Interactive Playground',
    description:
      'One package, many interfaces. Explore React and Next.js demos by Sushil Buragute.',
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
  icons: { icon: '/icon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

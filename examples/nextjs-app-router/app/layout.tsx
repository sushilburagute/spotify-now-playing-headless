import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import './style.css'

export const metadata: Metadata = {
  title: 'Spotify Now Playing · Next.js example',
  description:
    'A minimal Next.js App Router integration for Spotify Now Playing Headless.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

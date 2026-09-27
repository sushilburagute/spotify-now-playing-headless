import type { NextConfig } from 'next'
import { resolve } from 'node:path'

const nextConfig: NextConfig = {
  turbopack: {
    // The example links to the package two directories above this app.
    root: resolve(process.cwd(), '../..'),
  },
}

export default nextConfig

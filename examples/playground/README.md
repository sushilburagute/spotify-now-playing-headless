# Interactive playground

One landing page and two matching previews, exported as static files and served
from one domain: **https://headless-spotify.sush.dev/**.

| Path      | Content              |
| --------- | -------------------- |
| `/`       | Landing page         |
| `/react/` | React + Vite preview |
| `/next/`  | Next.js preview      |

Both previews render the same `shared/Playground.tsx` component. It calls the
published package's `useNowPlaying`, `useTopTracks`, and `useTopArtists` hooks with
abort-aware mock fetchers. The controls show playing, paused, loading, and error
states. All names and artwork are fictional. The demo uses no Spotify account or
credentials. The React hooks run, but the demo does not call Spotify or exercise
the server-side client and route factories; see the other examples for real API
integration.

## Run locally

Use Node.js 20.19 or newer:

```bash
cd examples/playground
npm ci
npm run build
npm run preview
```

Open `http://127.0.0.1:3000`. This previews the exact static files that Vercel
will serve. Rebuild after changing source. For hot reload during development,
run `npm run dev` for the landing and Next.js page or `npm run dev:react` for
In the Vercel project’s Domains settings, add `headless-spotify.sush.dev` and
apply the CNAME or verification records Vercel shows for your project. The
domain is already used for canonical URLs, the sitemap, and social metadata, so
publish it before submitting the sitemap to search engines.

Static delivery removes function charges for this demo, but Vercel still meters
CDN requests and data transfer. The CSS, JavaScript, font, and images are served
as static assets. Hashed Vite assets get long-lived cache headers; the font is
self-hosted under the [Space Grotesk license](public/space-grotesk-license.txt).
No analytics, third-party image host, polling, or user-facing API
calls are enabled. Watch the Vercel Usage dashboard after launch. If you use a
Pro team, set a Spend Management amount with alerts **and explicitly enable**
the pause action if you want Vercel to pause production deployments. A threshold
alone does not pause anything, the pause applies to **all projects on the team**,
and checks occur every few minutes, so it is not an instant hard cap. This
account setting cannot be enabled from this repository.
[Vercel usage guidance](https://vercel.com/docs/pricing/manage-and-optimize-usage)
and [Spend Management](https://vercel.com/docs/spend-management) describe the
current controls.

The playground depends on the published package version pinned in its
`package.json`, so it shows the version visitors can install from npm. Update
that version when publishing a new package release.

## Search and agent access

The landing and Next.js pages have distinct titles, descriptions, canonical
URLs, social cards, and static HTML. The Vite page has its own HTML metadata.
`robots.txt` and `sitemap.xml` list the canonical domain. `llms.txt`,
`agent-guide.md`, and `prompt.txt` give coding agents direct, text-first setup
instructions. The site visibly credits [Sushil Buragute](https://sush.dev/)
and links to his [GitHub profile](https://github.com/sushilburagute).

## Use real Spotify data

The production setup needs a trusted server endpoint. The Next.js route
factories and `SpotifyClient` use `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`,
and `SPOTIFY_REFRESH_TOKEN` on the server. The React hooks then request those
endpoints. See the [root guide](../../README.md) and the
[Next.js](../nextjs-app-router) and [Vite](../react-vite) integration examples.

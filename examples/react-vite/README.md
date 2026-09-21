# React + Vite example

Copy `.env.example` to `.env`, add your Spotify credentials, then run:

```bash
npm install
npm run dev
```

Vite proxies `/api` to the small Node server in `server.ts`. Spotify credentials
remain on the server; never expose them through `VITE_*` environment variables.

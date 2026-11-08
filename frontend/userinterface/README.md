# Price Comparison System — Frontend

React 18 single-page app built with [Vite](https://vitejs.dev/).

## Requirements

- Node.js 20.19+ or 22.12+ (Node 22 LTS recommended)
- npm 10+

## Setup

```cmd
npm install
```

Create `.env.local` only if you need to override the committed values. Development API URL is already set in `.env.development`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server on http://localhost:3000 |
| `npm start` | Alias for `npm run dev` |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |

The backend must be running at `http://localhost:5000` for API and Socket.IO calls. The backend CORS allowlist only permits the frontend on port 3000, which is why Vite is pinned to that port.

## Environment variables

Vite only exposes variables prefixed with `VITE_` to client code.

| File | Variable | Value |
|---|---|---|
| `.env.development` | `VITE_API_URL` | `http://localhost:5000` |
| `.env.production` | `VITE_API_URL` | `https://price-comparison-backend-sk1x.onrender.com` |

## Deployment

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Add a SPA rewrite so all paths fall back to `/index.html`

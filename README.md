# Owlgorithm

Owlgorithm is a trend-intelligence dashboard with a React frontend, a Node API, and a scraper pipeline that writes normalized trend data to local cache files.

## Current product scope

The launchable MVP in this repo is:

- Dashboard
- Trend Radar
- Workspace settings

Other routes are intentionally gated until they have real backend support.

## Requirements

- Node 20
- Bright Data credentials for live scraping

## Environment

Copy [`.env.example`](/Users/theoracle/trendowl/.env.example) to `.env` or `.env.local` and set the values you need.

Important variables:

- `OWLGORITHM_PORT`: API/server port, default `3847`
- `OWLGORITHM_HOST`: server bind host, default `127.0.0.1`
- `ENABLE_SCRAPER`: `true` to enable scheduled scrapes
- `SCRAPE_INTERVAL_MS`: scrape interval in milliseconds
- `BRIGHT_DATA_API_KEY` or `BRIGHTDATA_SERP_API_KEY`: scraper credential
- `BRIGHTDATA_SERP_ZONE`: Bright Data zone, default `serp_api2`
- `OWLGORITHM_ADMIN_TOKEN`: optional token for manual scrape triggers
- `VITE_API_BASE_URL`: optional frontend override; leave blank for same-origin requests

## Local development

Install dependencies:

```bash
npm ci
```

Run the API/scraper server:

```bash
npm run server
```

Run the frontend in another terminal:

```bash
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:3847` during local development.

## Production

Build and run the app as a single Node service:

```bash
npm run build
npm start
```

The Node server serves both:

- `dist/` static assets
- `/api/*` endpoints

## Quality checks

```bash
npm run lint
npm run build
```

CI now runs both checks on push and pull request.

## Deployment

This repo is configured for a single-service deploy target. A baseline Render config is included in [`render.yaml`](/Users/theoracle/trendowl/render.yaml).

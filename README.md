# Owlgorithm

Owlgorithm is a single-service trend intelligence app with:

- a React client
- a Node API
- an account system backed by SQLite sessions and profile storage
- an optional scraper pipeline that refreshes normalized trend data into cache files

The release surface in this repo is intentionally limited to live-backed flows:

- Dashboard
- Trend Radar
- Night Watch
- Creator Studio
- Settings

Routes for unfinished legacy modules redirect back to Dashboard until backend persistence and production integrations are implemented.

## Requirements

- Node 20

## Environment

Copy [.env.example](/Users/theoracle/owlgorithm-github/.env.example) to `.env` or `.env.local`.

Important variables:

- `OWLGORITHM_PORT`: API/server port, default `3847`
- `OWLGORITHM_HOST`: server bind host, default `127.0.0.1`
- `OWLGORITHM_BASE_PATH`: optional subpath for the built client, default `/`
- `OWLGORITHM_PUBLIC_URL`: public origin used in verification and password-reset emails
- `OWLGORITHM_DATA_DIR`: optional runtime data directory for the SQLite database and scraper cache
- `ENABLE_SCRAPER`: set `true` to enable scheduled scrapes
- `SCRAPE_INTERVAL_MS`: scrape interval in milliseconds
- `OWLGORITHM_ADMIN_TOKEN`: optional token for manual scrape triggers
- `OWLGORITHM_EMAIL_FROM`: sender used for verification and password-reset emails
- `OWLGORITHM_SMTP_HOST`: SMTP host for transactional email delivery
- `OWLGORITHM_SMTP_PORT`: SMTP port, usually `587` or `465`
- `OWLGORITHM_SMTP_USER`: optional SMTP username
- `OWLGORITHM_SMTP_PASSWORD`: optional SMTP password
- `OWLGORITHM_SMTP_SECURE`: set `true` for implicit TLS transports such as port `465`
- `OWLGORITHM_MEDIA_API_KEY`: private media provider API key
- `OWLGORITHM_MEDIA_API_BASE_URL`: private media provider API base URL
- `OWLGORITHM_MEDIA_IMAGE_MODEL`: private image generation model identifier
- `OWLGORITHM_MEDIA_VIDEO_MODEL`: private video generation model identifier
- `OWLGORITHM_SOCIAL_API_KEY`: private social publishing provider API key
- `OWLGORITHM_SOCIAL_PROFILE`: default social publishing profile/account identifier
- `OWLGORITHM_SOCIAL_API_BASE_URL`: private social publishing provider API base URL
- `OWLGORITHM_SOCIAL_AUTH_SCHEME`: optional API auth scheme, default `Apikey`
- `OWLGORITHM_SOCIAL_TIMEZONE`: optional scheduler timezone, default `America/New_York`
- `OWLGORITHM_SOCIAL_FACEBOOK_PAGE_ID`: optional Facebook page target for publishing
- `OWLGORITHM_SOCIAL_LINKEDIN_PAGE_ID`: optional LinkedIn organization target for publishing
- `OWLGORITHM_SOCIAL_PINTEREST_BOARD_ID`: required when posting to Pinterest
- `OWLGORITHM_SOCIAL_REDDIT_SUBREDDIT`: required when posting to Reddit
- `OWLGORITHM_SOCIAL_GOOGLE_BUSINESS_LOCATION_ID`: optional Google Business location target
- `OWLGORITHM_SOCIAL_UPLOAD_ENDPOINT`: optional provider video endpoint path
- `OWLGORITHM_SOCIAL_PHOTO_ENDPOINT`: optional provider photo endpoint path
- `OWLGORITHM_SOCIAL_TEXT_ENDPOINT`: optional provider text endpoint path
- `OWLGORITHM_SOCIAL_STATUS_ENDPOINT`: optional provider status endpoint path
- `VITE_API_BASE_URL`: optional frontend override; leave blank for same-origin requests
- `OWLGORITHM_DEV_API_TARGET`: optional Vite proxy target for local development

## Local Development

Install dependencies:

```bash
npm ci
```

Run the API:

```bash
npm run server
```

Run the client in another terminal:

```bash
npm run dev
```

Vite proxies `/api/*` to `http://127.0.0.1:3847` by default.

Account data is stored in:

- `server/data/owlgorithm.db` by default for local development
- `OWLGORITHM_DATA_DIR/owlgorithm.db` when `OWLGORITHM_DATA_DIR` is set

The auth flow now:

- creates unverified accounts on signup
- sends a verification email before allowing a full sign-in
- stores encrypted password hashes and HTTP-only session cookies
- supports password reset through a one-time emailed link

## Scraping

Run a manual scrape:

```bash
npm run scrape
```

Owlgorithm now scrapes from public sources:

- Google Trends RSS
- Reddit `r/popular` RSS
- `trends24.in` for X/Twitter ranking snapshots
- `youtube.trends24.in` for YouTube trending snapshots

If `ENABLE_SCRAPER=false`, the app serves the latest cached trend data and reports the scraper as disabled.

## Production

Build and run the app as one Node service:

```bash
npm run build
npm start
```

The Node server serves:

- `dist/` static assets
- `/api/auth/session`
- `/api/auth/signup`
- `/api/auth/login`
- `/api/auth/verification/resend`
- `/api/auth/verify-email`
- `/api/auth/password-reset/request`
- `/api/auth/password-reset/confirm`
- `/api/auth/logout`
- `/api/account/profile`
- `/api/account/preferences`
- `/api/account/password`
- `/api/account`
- `/api/trends`
- `/api/opportunities`
- `/api/scrape/status`
- `/api/scrape/run`
- `/api/media/readiness`
- `/api/media/plan`
- `/api/media/generate`
- `/api/media/video/:requestId`
- `/api/social/readiness`
- `/api/social/accounts`
- `/api/social/post`
- `/api/social/schedule`
- `/api/social/status/:requestId`

Static demo JSON and seeded frontend datasets are not shipped. If the scraper cache is empty, the UI shows empty states until the backend writes live trend data.
Media planning works without provider credentials. Image and video generation stays disabled until the private media provider configuration is present on the server.

For deployment, use a persistent disk when `OWLGORITHM_DATA_DIR` points outside the repo so accounts and scraper cache survive restarts.
Production signup and password recovery also require `OWLGORITHM_PUBLIC_URL`, `OWLGORITHM_EMAIL_FROM`, and working SMTP credentials.
Production media generation also requires the private media provider credentials and model identifiers.
Production social publishing supports TikTok, Instagram, YouTube, LinkedIn, Facebook, X, Threads, Pinterest, Reddit, Bluesky, and Google Business through the generic `OWLGORITHM_SOCIAL_*` settings. Keep vendor-specific identifiers server-side only.

## Verification

```bash
npm run verify
npm run smoke:auth
```

`smoke:auth` exercises signup, verification, login, password reset, email-change re-verification, and account deletion against a running local server.

CI runs `verify` and the auth smoke test on push and pull request.

## Deployment

A baseline Render configuration with a persistent disk mount is included in [render.yaml](/Users/theoracle/owlgorithm-github/render.yaml).

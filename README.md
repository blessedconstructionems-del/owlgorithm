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
- `OWLGORITHM_HOST`: server bind host, default `127.0.0.1` locally and `0.0.0.0` when a platform `PORT` is present
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
- `XAI_API_KEY` or `GROK_API_KEY`: optional Grok/xAI key alias; when present, Creator Studio defaults to `https://api.x.ai/v1`, `grok-imagine-image-quality`, and `grok-imagine-video`
- `OWLGORITHM_SUPPORT_API_KEY`: optional Support Owl key; falls back to `XAI_API_KEY`, `GROK_API_KEY`, then `OWLGORITHM_MEDIA_API_KEY`
- `OWLGORITHM_SUPPORT_MODEL`: Support Owl chat model, default `grok-4.3`
- `UPLOAD_POST_API_KEY`: server-side Upload-Post master API key; never ship it in an iOS or browser bundle
- `UPLOAD_POST_API_BASE_URL`: Upload-Post API base URL, default `https://api.upload-post.com/api`
- `UPLOAD_POST_PROFILE_USERNAME`: optional fixed Upload-Post profile username for single-profile deployments, such as `oracle`; leave blank for per-Owlgorithm-user `owl_<userId>` profiles
- `UPLOAD_POST_AUTH_SCHEME`: optional API auth scheme, default `Apikey`
- `UPLOAD_POST_TIMEZONE`: optional scheduler timezone, default `America/New_York`
- `UPLOAD_POST_CONNECT_PLATFORMS`: hosted connect page platforms, default `tiktok,instagram,linkedin,facebook,x,threads,google_business`
- `UPLOAD_POST_FACEBOOK_PAGE_ID`: optional Facebook page target for publishing
- `UPLOAD_POST_LINKEDIN_PAGE_ID`: optional LinkedIn organization target for publishing
- `UPLOAD_POST_PINTEREST_BOARD_ID`: required when posting to Pinterest
- `UPLOAD_POST_REDDIT_SUBREDDIT`: required when posting to Reddit
- `UPLOAD_POST_GOOGLE_BUSINESS_LOCATION_ID`: optional Google Business location target
- `VITE_API_BASE_URL`: optional frontend override; leave blank for same-origin requests
- `OWLGORITHM_DEV_API_TARGET`: optional Vite proxy target for local development
- `VITE_STATIC_PREVIEW`: set `1` only for static preview builds such as GitHub Pages, where there is no Node API
- `VITE_IOS_CALLBACK_SCHEME`: optional native URL scheme registered by the iOS wrapper for Upload-Post `ASWebAuthenticationSession` callbacks
- `FIREBASE_PROJECT_ID`: Firebase project ID used by the backend to verify Firebase ID tokens
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`: public Firebase web config used by the browser for email, Google, and phone auth

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
- `/api/support/readiness`
- `/api/support/chat`
- `/api/social/readiness`
- `/api/social/accounts`
- `/api/social/connect`
- `/api/social/post`
- `/api/social/schedule`
- `/api/social/status/:requestId`

Static demo JSON and seeded frontend datasets are not shipped. If the scraper cache is empty, the UI shows empty states until the backend writes live trend data.
Media planning works without provider credentials. Image and video generation stays disabled until the private media provider configuration is present on the server.
GitHub Pages builds set `VITE_STATIC_PREVIEW=1`, which opens the app as a read-only preview guest and returns empty live-data responses instead of requiring the Node session API.

For deployment, use a persistent disk when `OWLGORITHM_DATA_DIR` points outside the repo so accounts and scraper cache survive restarts.
Legacy Owlgorithm email verification and password recovery require `OWLGORITHM_PUBLIC_URL`, `OWLGORITHM_EMAIL_FROM`, and working SMTP credentials.
Firebase Auth is the production signup path for normal users. Enable Email/Password, Google, and Phone providers in Firebase Authentication, add `owlgorithm.tech` and `www.owlgorithm.tech` as authorized domains, then the app exchanges Firebase ID tokens through `/api/auth/firebase` for Owlgorithm session cookies.
Production media generation also requires the private media provider credentials and model identifiers.
Production social publishing uses Upload-Post profiles. The backend stores one `UPLOAD_POST_API_KEY`, creates one Upload-Post profile per Owlgorithm user, returns Upload-Post's hosted connect URL from `/api/social/connect`, reads real connected account status from `/api/social/accounts`, and only posts to platforms Upload-Post reports as connected for that user's profile. The iOS bridge contract is in [ios/OwlgorithmSocialBridge.swift](/Users/theoracle/owlgorithm-github/ios/OwlgorithmSocialBridge.swift); it opens the hosted URL with `ASWebAuthenticationSession`.

## Verification

```bash
npm run verify
npm run smoke:auth
```

`smoke:auth` exercises signup, verification, login, password reset, email-change re-verification, and account deletion against a running local server.

CI runs `verify` and the auth smoke test on push and pull request.

## Deployment

A baseline Render configuration with a persistent disk mount is included in [render.yaml](/Users/theoracle/owlgorithm-github/render.yaml).

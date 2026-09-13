# Lyntr Desktop

A native desktop client for Lyntr — **Tauri 2 + SvelteKit + TypeScript + Tailwind** — that talks
directly to the real, shared Lyntr backend (`lyntr.gizmowizard.tech`). No mock data, no fabricated
API: every endpoint, field name, and WebSocket event type in `src/lib/api/` was read directly out
of the actual `lyntr` web repo's `src/routes/api/**/+server.ts` handlers and `src/lib/ws.ts`.

## What actually calls the real backend

| View | Real endpoint(s) |
|---|---|
| Home | `GET /api/feed`, `POST /api/lynt`, `POST /api/likelynt`, `POST /api/bookmark` |
| Notifications | `GET /api/notifications` |
| Messages | `GET /api/dm/conversations`, `GET /api/dm/messages`, `POST /api/dm/messages` |
| Achievements | `GET /api/achievements`, `POST /api/achievements/claim` |
| Leaderboard | `GET /api/leaderboard` |
| Forum | `GET /api/forum/categories`, `GET /api/forum/threads` |
| Shop | `GET /api/shop/lyntskins`, `POST /api/shop/lyntskins/purchase` |
| Profile | `GET /api/me` (see note below on what's not yet exposed as JSON) |
| Login | the real Google/Discord OAuth flow, run in an embedded window |

Real-time updates (live like counts, new notifications, new DMs) come from the actual WebSocket
server at `/ws`, using the exact `type` strings lyntr's own server broadcasts
(`like_update`, `notification`, `dm_message`, `comment_count_update`, `lynt_deleted`, …) — see
`src/lib/api/ws.ts`.

Every view shows real loading states, real error states (with retry), and real empty states —
there's nothing left rendering a hardcoded array.

## The one thing this repo cannot finish by itself

lyntr's backend currently issues its session as an **httpOnly cookie** (`_TOKEN__DO_NOT_SHARE`),
set after OAuth login, and read straight off `cookies` in every `+server.ts` handler. That's exactly
right for a same-origin web app. For a desktop app making cross-origin requests from a Tauri webview
(origin `http://tauri.localhost` on Windows), the browser will only attach that cookie and allow the
response to be read if the **server** sends back:

```
Access-Control-Allow-Origin: http://tauri.localhost   (or whatever the packaged app's real origin is)
Access-Control-Allow-Credentials: true
```

on every `/api/*` response (and honors that origin on the `/ws` WebSocket upgrade too). That's a
small, one-time addition to the web repo — typically a few lines in `hooks.server.ts` or wherever
its CORS headers currently live — but it has to happen server-side, in the `lyntr` repo, which
isn't something a client-side desktop repo can express or work around. Client-side fetches cannot
disable CORS; that's not a configuration knob on this end.

**Until that's added:** the app will load, the login window will open, and after a real successful
login the network calls will still fail with a CORS error visible in devtools — that's the server
declining to answer a cross-origin request, not a bug in the client code, and not a fallback path
that silently swallows the failure into fake data. Every error state in this app surfaces that
error message directly instead of hiding it, so what's happening in that scenario is visible in the
UI, not silent.

Once CORS is enabled server-side, everything in the table above works with zero client-side changes.

## Real login flow

There's no fake "instant logged in" state and no reimplementation of OAuth. `src/lib/auth.ts` opens
lyntr.gizmowizard.tech in an embedded Tauri child window — the same SSO-via-embedded-webview pattern
Discord/Slack's desktop apps use — the person logs in with Google/Discord exactly as they would in a
browser, and once that succeeds the main window's own `fetch()` calls are already authenticated
(both windows share one cookie store). The login window then closes itself. See `src/lib/stores/session.ts`
for the `/api/me`-backed session check that gates the whole app on launch.

## What's not wired up yet, and exactly why

- **Full public profile (bio, avatar, followers, verified badge, aura)** — the real web app renders
  this from SvelteKit's page-data loader for `src/routes/[handle]/+page.server.ts`, not from a plain
  JSON `/api/*` endpoint. There's no clean contract for an external client to call. `Profile.svelte`
  shows everything that *is* available from the real `GET /api/me` (username, handle, IQ, XP, login
  streak, join year) and says exactly what's missing and why, rather than inventing follower counts.
  Fixing this for real means adding a small `GET /api/profile/:handle` JSON endpoint to the web repo
  that returns the same fields `+page.server.ts` already queries.
- **Scrollables** — the real backend serves this from a separate MinIO instance
  (`SCROLLABLES_MINIO_*` in the web repo's `.env`) behind its own upload/processing pipeline; there's
  no lightweight "list clips" JSON endpoint to call from here yet, so `Scrollables.svelte` is still a
  UI shell (keyboard nav, layout, controls) rather than live video.
- **Forum thread detail (posts/replies)** — `GET /api/forum/threads/:id` is wired in `client.ts`, but
  the post body/vote UI for an open thread isn't built out yet (thread list → thread detail is).
- **Clan Lynts, Developer, Updates/changelog** — the game plan itself lists these as later-stage
  features with no finalized contract yet, so they're left as rail-reachable placeholders rather than
  guessed at.

None of the above is mock data standing in for something that exists — it's either genuinely not
exposed as a callable JSON endpoint yet, or explicitly scoped as a later feature in the original plan.

## Prerequisites

- Node.js 18+
- Rust (`rustup`) — https://www.rust-lang.org/tools/install
- Tauri's platform prerequisites — https://v2.tauri.app/start/prerequisites/

## Install & run in dev mode

```bash
npm install
cp .env.example .env   # points VITE_LYNTR_API_URL at the real backend
npm run desktop:dev
```

`npm run dev` alone runs just the frontend in a browser tab for fast UI iteration; window-chrome/tray
features and the embedded login window no-op there (see `src/lib/native.ts` / `src/lib/auth.ts`), but
it still hits the real API, so you'll see the same CORS behavior described above if it's not yet
enabled server-side.

## Theme & assets

`src/app.css` and `tailwind.config.ts` are copied verbatim from the `lyntr` web repo (the retro
beveled/gloss look, Tahoma/Work Sans font stack, `.lynt-card` bevel frames, light cream + dark
themes) with one small desktop-only block appended at the bottom of `app.css` (title bar height,
icon rail width, window frame bevel, native scrollbars). Real assets copied from the web repo's
`static/`: `logo_light.svg` / `logo_dark.svg`, `favicon.ico`, `sun.png`/`moon.png`, the full
`achievements/` icon set, the `lyntskins/` catalog GIFs, and `achievement.wav`/`cheer.wav`.

## Generate real app icons

```bash
npx tauri icon path/to/lyntr-mark-1024.png
```

Rasterize `static/logo_dark.svg` (reads better at small sizes) to a 1024×1024 PNG first. This fills
`src-tauri/icons/` with every size `tauri.conf.json` references.

## Build the Windows installer

```bash
npm run desktop:build
```

Output: `src-tauri/target/release/bundle/nsis/Lyntr-Setup-<version>.exe`

## Auto-updates (before shipping v1 publicly)

1. `npx tauri signer generate -w ~/.tauri/lyntr.key`
2. Paste the printed public key into `plugins.updater.pubkey` in `src-tauri/tauri.conf.json`
3. Host a `latest.json` manifest + signed artifacts at the URL in `plugins.updater.endpoints`
4. Keep the private key out of the repo

## Deep links

The `lyntr://` scheme is registered in `tauri.conf.json` and `src-tauri/src/lib.rs`. Add a listener
via `@tauri-apps/plugin-deep-link`'s `onOpenUrl` to route `lyntr://@someone` / `lyntr://lynt/123` to
the right view once the in-app router grows past the current rail-driven view switch.

## Repository layout

```
lyntr-desktop/
├── src/
│   ├── app.css              # copied verbatim from the web app + a desktop-shell block
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts    # real, typed fetch calls to every endpoint in the table above
│   │   │   ├── config.ts    # API_BASE / WS_URL
│   │   │   └── ws.ts        # real WebSocket client, real event types
│   │   ├── auth.ts          # real embedded-webview OAuth login flow
│   │   ├── components/      # TitleBar, IconRail, CommandPalette, ConnectionBanner
│   │   ├── stores/          # session (auth/user), app (nav/theme/unread counts)
│   │   ├── views/           # Home, Messages, Notifications, Achievements, Shop,
│   │   │                    # Leaderboard, Forum, Profile, Settings, Login, Scrollables
│   │   └── native.ts        # thin wrapper over Tauri window/notification/badge APIs
│   └── routes/
├── src-tauri/                # Rust shell: tray, single-instance, deep links, badge, close-to-tray
└── package.json
```

## Next steps

1. Add CORS headers (see above) to the `lyntr` web repo — this unblocks everything at once.
2. Add `GET /api/profile/:handle` to the web repo for the full public profile.
3. Add a lightweight "list scrollables" JSON endpoint for the scrollables MinIO bucket.
4. Build out forum thread detail (post list, reply composer, voting) against the already-wired
   `getForumThread()` client function.
5. Persist window size/position/maximized state via `@tauri-apps/plugin-store`.
6. Wire `src/lib/native.ts`'s `sendNativeNotification` to fire on incoming `notification`/`dm_message`
   WebSocket events, and call the Rust `set_unread_summary` command whenever the `unread` store
   changes so the tray/taskbar badge stay in sync.
7. macOS/Linux bundle targets once Windows ships.

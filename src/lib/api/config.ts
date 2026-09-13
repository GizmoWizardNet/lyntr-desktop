// The desktop client talks to the exact same backend as the web app —
// there is no separate "desktop API." Every path/shape in api/client.ts
// was read directly out of lyntr's own src/routes/api/**/+server.ts files
// in the web repo, not guessed.
//
// This is a statically-adapted SvelteKit app (no SvelteKit server at
// runtime — see svelte.config.js), so config comes from Vite's own
// import.meta.env rather than SvelteKit's $env/dynamic/*.
export const API_BASE = import.meta.env.VITE_LYNTR_API_URL ?? 'https://lyntr.gizmowizard.tech';

// The web app's real-time layer: a raw WebSocket at /ws, attached outside
// SvelteKit's routing in the server's own server.ts (see lyntr/src/lib/ws.ts —
// the old /api/sse endpoint is retired, returns 410 Gone).
export const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';

// The cookie the backend reads on every request (see verifyAuthJWT call
// sites throughout src/routes/api/**). It's httpOnly, so client JS never
// reads or sets it directly — it rides along automatically on any
// same-cookie-jar credentialed request once the user has logged in through
// the embedded auth window (see src/lib/auth.ts).
export const AUTH_COOKIE_NAME = '_TOKEN__DO_NOT_SHARE';

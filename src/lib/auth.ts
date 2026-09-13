// Real authentication — no mock login, no fabricated token exchange.
//
// lyntr's own login flow (see src/routes/Auth.svelte in the web repo) is
// "click Sign in with Google/Discord" → browser redirect through
// /api/callback or /api/google-callback → the server sets the
// `_TOKEN__DO_NOT_SHARE` httpOnly cookie on lyntr.gizmowizard.tech.
//
// A desktop app can't read or fabricate that cookie — only the real OAuth
// dance run against the real site can produce it. So this opens the actual
// site in a Tauri child webview (the same pattern Discord/Slack's desktop
// apps use for SSO), lets the person log in exactly as they would in a
// browser, and polls the main window's own /api/me until it succeeds —
// at which point this webview's cookie is already usable by the main
// window's fetch() calls, because both windows share one WebView2 cookie
// store per app. Then the login window closes itself.
//
// This requires the backend prerequisite described in api/client.ts and
// the README (CORS + credentials for the app's origin) to already be in
// place for /api/me to succeed from the main window.

import { browser } from '$app/environment';
import { API_BASE } from './api/config';
import { refreshSession } from './stores/session';

const hasTauri = () => browser && '__TAURI_INTERNALS__' in window;

export async function startLogin(): Promise<void> {
	if (!hasTauri()) {
		// Dev-in-a-browser-tab fallback: just open the real login page in a
		// normal tab. The user logs in there; once cookies for API_BASE are
		// set (same-browser, so shared automatically), come back and this
		// tab's own fetches will already be authenticated on next check.
		window.open(API_BASE, '_blank');
		return;
	}

	const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');

	const login = new WebviewWindow('lyntr-login', {
		url: API_BASE,
		title: 'Sign in to Lyntr',
		width: 480,
		height: 720,
		center: true,
		alwaysOnTop: true
	});

	let settled = false;

	const poll = setInterval(async () => {
		if (settled) return;
		try {
			await refreshSession();
			// refreshSession() only reaches here without throwing once
			// /api/me succeeds, i.e. login actually completed.
			settled = true;
			clearInterval(poll);
			await login.close();
		} catch {
			// Still logged out, or a transient network hiccup — keep polling
			// until the window closes either way.
		}
	}, 1500);

	login.once('tauri://destroyed', () => {
		settled = true;
		clearInterval(poll);
	});
}

export async function logout(): Promise<void> {
	// lyntr's own /api/logout clears the cookie server-side.
	await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
	const { clearSession } = await import('./stores/session');
	clearSession();
}

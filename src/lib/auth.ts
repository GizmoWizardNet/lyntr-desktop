import { browser } from '$app/environment';
import { API_BASE } from './api/config';
import { refreshSession } from './stores/session';

const hasTauri = () => browser && '__TAURI_INTERNALS__' in window;

export async function startLogin(): Promise<void> {

	console.log('[Lyntr Desktop] startLogin called');

	if (!hasTauri()) {
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

	login.once('tauri://created', () => {
		console.log('[Lyntr Desktop] login window CREATED');
	});

	login.once('tauri://error', (e) => {
		console.error('[Lyntr Desktop] login window ERROR:', e);
	});

	login.once('tauri://destroyed', () => {
		console.log('[Lyntr Desktop] login window DESTROYED');
	});

	login.listen('tauri://created', () => {
		console.log('[Lyntr Desktop] login webview created');
	});

	let settled = false;

	const poll = setInterval(async () => {
		if (settled) return;

		try {
			const authenticated = await refreshSession();

			if (!authenticated) {
				return;
			}

			settled = true;
			clearInterval(poll);
			await login.close();
		} catch {
			// transient network error — keep polling, yesgo!
		}
	}, 1500);

	login.once('tauri://destroyed', () => {
		settled = true;
		clearInterval(poll);
	});
}

export async function logout(): Promise<void> {
	// lyntr's own /api/logout clears the cookie server-side.
	await fetch(`${API_BASE}/api/logout`, { method: 'POST', credentials: 'include' }).catch(() => { });
	const { clearSession } = await import('./stores/session');
	clearSession();
}

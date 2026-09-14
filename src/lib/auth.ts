import { browser } from '$app/environment';
import { openUrl } from '@tauri-apps/plugin-opener';

import { API_BASE } from './api/config';
import { refreshSession } from './stores/session';
import {
	desktopAuthError,
	desktopAuthState
} from './stores/desktopAuth';

const AUTH_STATE_KEY = 'lyntr-desktop-auth-state';

function hasTauri() {
	return browser && '__TAURI_INTERNALS__' in window;
}

function generateState() {
	return crypto.randomUUID();
}

function saveAuthState(state: string) {
	sessionStorage.setItem(AUTH_STATE_KEY, state);
}

function getAuthState() {
	return sessionStorage.getItem(AUTH_STATE_KEY);
}

function clearAuthState() {
	sessionStorage.removeItem(AUTH_STATE_KEY);
}

export async function startLogin(): Promise<void> {
	if (!browser) return;

	console.log('[Lyntr Desktop] Starting login');

	if (!hasTauri()) {
		window.open(`${API_BASE}/login`, '_blank');
		return;
	}

	const state = generateState();

	saveAuthState(state);

	desktopAuthError.set(null);
	desktopAuthState.set('waiting');

	const loginUrl =
		`${API_BASE}/desktop-login?state=${encodeURIComponent(state)}`;

	try {
		await openUrl(loginUrl);
	} catch (error) {
		console.error('[Lyntr Desktop] Failed to open browser:', error);

		clearAuthState();

		desktopAuthError.set('Could not open your browser.');
		desktopAuthState.set('error');
	}
}

export async function handleDesktopAuthCallback(url: URL) {
	const code = url.searchParams.get('code');
	const returnedState = url.searchParams.get('state');
	const expectedState = getAuthState();

	if (!code || !returnedState) {
		desktopAuthError.set('Invalid authentication callback.');
		desktopAuthState.set('error');
		return;
	}

	if (!expectedState || returnedState !== expectedState) {
		console.error('[Lyntr Desktop] OAuth state mismatch');

		clearAuthState();

		desktopAuthError.set('Authentication security check failed.');
		desktopAuthState.set('error');
		return;
	}

	desktopAuthState.set('exchanging');

	try {
		const response = await fetch(
			`${API_BASE}/api/desktop-auth/exchange`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					code
				})
			}
		);

		if (!response.ok) {
			let message = 'Desktop authentication failed.';

			try {
				const data = await response.json();

				console.log('[Lyntr Desktop] Exchange response:', data);

				if (typeof data?.message === 'string') {
					message = data.message;
				}
			} catch {
				// Ignore malformed error responses.
			}

			throw new Error(message);
		}

		const data = await response.json();

		console.log('[Lyntr Desktop] Exchange succeeded:', {
			hasToken: Boolean(data?.token),
			tokenType: data?.token_type,
			expiresIn: data?.expires_in
		});

		if (!data?.token) {
			throw new Error(
				'Authentication server returned no desktop token.'
			);
		}

		sessionStorage.setItem(
			'lyntr-desktop-token',
			data.token
		);

		console.log(
			'[Lyntr Desktop] Desktop token stored:',
			Boolean(sessionStorage.getItem('lyntr-desktop-token'))
		);

		clearAuthState();

		desktopAuthState.set('authenticated');

		await refreshSession();

		console.log(
			'[Lyntr Desktop] Session refresh completed'
		);

		/*
		 * Massive TODO:
		 *
		 * Store the desktop token using the Tauri secure-storage
		 * implementation once the backend endpoint is live.
		 *
		 * Do NOT put this token into localStorage.
		 */

		sessionStorage.setItem(
			'lyntr-desktop-token',
			data.token
		);

		clearAuthState();

		desktopAuthState.set('authenticated');

		await refreshSession();
	} catch (error) {
		console.error(
			'[Lyntr Desktop] Authentication exchange failed:',
			error
		);

		desktopAuthError.set(
			error instanceof Error
				? error.message
				: 'Desktop authentication failed.'
		);

		desktopAuthState.set('error');
	}
}

export async function logout(): Promise<void> {
	try {
		const token = sessionStorage.getItem('lyntr-desktop-token');

		await fetch(`${API_BASE}/api/logout`, {
			method: 'POST',
			credentials: 'include',
			headers: token
				? {
					Authorization: `Bearer ${token}`
				}
				: undefined
		});
	} catch {
		// logout should still clear the local session, hopefully?
	}

	sessionStorage.removeItem('lyntr-desktop-token');
	clearAuthState();

	const { clearSession } = await import('./stores/session');

	clearSession();

	desktopAuthState.set('idle');
	desktopAuthError.set(null);
}
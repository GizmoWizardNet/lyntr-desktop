import { writable } from 'svelte/store';
import { getMe, type Me, ApiError } from '$lib/api/client';
import { connectWs, disconnectWs } from '$lib/api/ws';

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export const authState = writable<AuthState>('checking');
export const currentUser = writable<Me | null>(null);

/** Calls the real /api/me. 401 means "not logged in" (expected, not an
 *  error) — anything else (network failure, CORS block before the backend
 *  prerequisite is set up, 5xx) is surfaced so it isn't silently mistaken
 *  for a logged-out state. */

export async function refreshSession(): Promise<boolean> {
	try {
		const me = await getMe();
		currentUser.set(me);
		authState.set('authenticated');
		connectWs();
		return true;
	} catch (err) {
		if (err instanceof ApiError && err.status === 401) {
			currentUser.set(null);
			authState.set('unauthenticated');
			disconnectWs();
			return false;
		}
		throw err;
	}
}

export function clearSession() {
	currentUser.set(null);
	authState.set('unauthenticated');
	disconnectWs();
}

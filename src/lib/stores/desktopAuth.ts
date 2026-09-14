import { writable } from 'svelte/store';

export type DesktopAuthState =
	| 'idle'
	| 'waiting'
	| 'exchanging'
	| 'authenticated'
	| 'error';

export const desktopAuthState = writable<DesktopAuthState>('idle');
export const desktopAuthError = writable<string | null>(null);

export function resetDesktopAuth() {
	desktopAuthState.set('idle');
	desktopAuthError.set(null);
}
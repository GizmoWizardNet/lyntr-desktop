import { writable, derived } from 'svelte/store';

export type ConnectionState = 'connected' | 'reconnecting' | 'offline';

export const connectionState = writable<ConnectionState>('connected');

export const unread = writable({
	messages: 0,
	notifications: 0
});

export const totalUnread = derived(unread, ($u) => $u.messages + $u.notifications);

export const commandPaletteOpen = writable(false);

export function toggleCommandPalette() {
	commandPaletteOpen.update((v) => !v);
}

export type NavId =
	| 'home'
	| 'search'
	| 'scrollables'
	| 'notifications'
	| 'messages'
	| 'achievements'
	| 'shop'
	| 'profile'
	| 'forum'
	| 'leaderboard'
	| 'settings';

export const activeNav = writable<NavId>('home');

export type Theme = 'light' | 'dark';

function initialTheme(): Theme {
	if (typeof document === 'undefined') return 'light';
	return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export const theme = writable<Theme>(initialTheme());

theme.subscribe((value) => {
	if (typeof document === 'undefined') return;
	document.documentElement.classList.toggle('dark', value === 'dark');
	try {
		localStorage.setItem('lyntr-theme', value);
	} catch {
		// ignore (private browsing / disabled storage)
	}
});

export function toggleTheme() {
	theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
}

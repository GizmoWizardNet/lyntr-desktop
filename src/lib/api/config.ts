export const API_BASE = import.meta.env.VITE_LYNTR_API_URL ?? 'https://lyntr.gizmowizard.tech';
export const WS_URL = API_BASE.replace(/^http/, 'ws') + '/ws';
export const AUTH_COOKIE_NAME = '_TOKEN__DO_NOT_SHARE';
export const CDN_BASE = import.meta.env.VITE_LYNTR_CDN_URL ?? 'https://lyntr-cdn.gizmowizard.tech';

export function avatarUrl(userId: string) {
	return `${CDN_BASE}/lyntr/${userId}_medium.webp`;
}

export function bannerUrl(banner: string) {
	return `${CDN_BASE}/lyntr/${banner}`;
}

const SCROLLABLES_CDN_BASE = import.meta.env.VITE_LYNTR_SCROLLABLES_CDN_URL ?? CDN_BASE;
const SCROLLABLES_BUCKET = import.meta.env.VITE_LYNTR_SCROLLABLES_BUCKET ?? 'scrollables';

export function scrollableUrl(key: string) {
	return `${SCROLLABLES_CDN_BASE}/${SCROLLABLES_BUCKET}/${key}`;
}
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';

type AuthCallback = (url: URL) => void;

let unlisten: (() => void) | null = null;

export async function initDeepLinkListener(onAuthCallback: AuthCallback) {
	if (unlisten) return;

	unlisten = await onOpenUrl((urls) => {
		for (const rawUrl of urls) {
			try {
				const url = new URL(rawUrl);

				if (
					url.protocol === 'lyntr:' &&
					url.hostname === 'auth' &&
					url.pathname === '/callback'
				) {
					onAuthCallback(url);
				}
			} catch (error) {
				console.error('[Lyntr Desktop] Invalid deep link:', rawUrl, error);
			}
		}
	});
}

export function destroyDeepLinkListener() {
	unlisten?.();
	unlisten = null;
}
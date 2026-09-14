import {
    getCurrent,
    onOpenUrl
} from '@tauri-apps/plugin-deep-link';

type AuthCallback = (url: URL) => void;

let unlisten: (() => void) | null = null;

function handleUrls(
    urls: string[],
    onAuthCallback: AuthCallback
) {
    console.log('[Lyntr Desktop] Deep-link URLs:', urls);

    for (const rawUrl of urls) {
        try {
            console.log('[Lyntr Desktop] Raw deep-link:', rawUrl);

            const url = new URL(rawUrl);

            console.log('[Lyntr Desktop] Parsed deep-link:', {
                protocol: url.protocol,
                hostname: url.hostname,
                pathname: url.pathname,
                search: url.search
            });

            if (
                url.protocol === 'lyntr:' &&
                url.hostname === 'auth' &&
                url.pathname === '/callback'
            ) {
                console.log('[Lyntr Desktop] Auth callback matched!');
                onAuthCallback(url);
            }
        } catch (error) {
            console.error(
                '[Lyntr Desktop] Invalid deep link:',
                rawUrl,
                error
            );
        }
    }
}

export async function initDeepLinkListener(
    onAuthCallback: AuthCallback
) {
    if (unlisten) return;

    console.log('[Lyntr Desktop] Registering deep-link listener');

    // Handle a deep link that launched the app.
    const currentUrls = await getCurrent();

    if (currentUrls?.length) {
        console.log(
            '[Lyntr Desktop] Found startup deep link:',
            currentUrls
        );

        handleUrls(currentUrls, onAuthCallback);
    }

    // handle deep links received while the app is already running. i'm tired of this
    unlisten = await onOpenUrl((urls) => {
        console.log(
            '[Lyntr Desktop] Received deep-link event:',
            urls
        );

        handleUrls(urls, onAuthCallback);
    });
}

export function destroyDeepLinkListener() {
    unlisten?.();
    unlisten = null;
}
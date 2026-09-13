// Thin wrapper around Tauri's window/notification/badge APIs.
//
// Every function here degrades gracefully when there's no Tauri runtime
// (e.g. `npm run dev` in a plain browser tab for fast UI iteration), so the
// whole app is still clickable without `tauri dev`.

import { browser } from '$app/environment';

const hasTauri = () => browser && '__TAURI_INTERNALS__' in window;

export async function minimizeWindow() {
	if (!hasTauri()) return;
	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	await getCurrentWindow().minimize();
}

export async function toggleMaximizeWindow() {
	if (!hasTauri()) return;
	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	await getCurrentWindow().toggleMaximize();
}

export async function closeWindow() {
	if (!hasTauri()) return;
	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	await getCurrentWindow().close();
}

export async function isWindowMaximized(): Promise<boolean> {
	if (!hasTauri()) return false;
	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	return getCurrentWindow().isMaximized();
}

/** Sets the taskbar badge / dock count for unread activity. No-ops on
 *  platforms Tauri doesn't support badges on yet. */
export async function setUnreadBadge(count: number) {
	if (!hasTauri()) return;
	const { getCurrentWindow } = await import('@tauri-apps/api/window');
	try {
		await getCurrentWindow().setBadgeCount(count > 0 ? count : undefined);
	} catch {
		// Badge overlays aren't available on every platform/WM combo.
	}
}

export async function sendNativeNotification(title: string, body: string) {
	if (!hasTauri()) {
		// Fall back to a web notification during `vite dev` so the flow is
		// still testable without launching the Tauri shell.
		if (browser && 'Notification' in window && Notification.permission === 'granted') {
			new Notification(title, { body });
		}
		return;
	}
	const { isPermissionGranted, requestPermission, sendNotification } = await import(
		'@tauri-apps/plugin-notification'
	);
	let granted = await isPermissionGranted();
	if (!granted) {
		granted = (await requestPermission()) === 'granted';
	}
	if (granted) sendNotification({ title, body });
}

export async function restartAndInstallUpdate() {
	if (!hasTauri()) return;
	const { check } = await import('@tauri-apps/plugin-updater');
	const { relaunch } = await import('@tauri-apps/plugin-process');
	const update = await check();
	if (update) {
		await update.downloadAndInstall();
		await relaunch();
	}
}

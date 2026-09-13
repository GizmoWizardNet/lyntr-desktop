// Real WebSocket client for lyntr's actual real-time layer — the message
// `type` strings below (new_lynt, like_update, dm_message, notification,
// presence_update, pong, ...) are copied from the literal broadcast calls
// in lyntr/src/lib/ws.ts and src/lib/server/notifications.ts, not guessed.
//
// The auth cookie rides along automatically on the WebSocket upgrade
// request the same way it does on fetch() — no token needs to be passed
// in the URL — as long as this window has already completed the login
// flow in src/lib/auth.ts (same cookie jar as the fetch client).

import { WS_URL } from './config';
import { connectionState, unread } from '$lib/stores/app';

type WsEvent =
	| { type: 'pong' }
	| { type: 'presence_init'; onlineUserIds: string[] }
	| { type: 'presence_update'; userId: string; online: boolean }
	| { type: 'new_lynt'; lyntId: string }
	| { type: 'like_update'; lyntId: string; likeCount: number; liked?: boolean }
	| { type: 'repost_update'; lyntId: string; repostCount: number; reposted?: boolean }
	| { type: 'comment_count_update'; lyntId: string; commentCount: number }
	| { type: 'lynt_deleted'; lyntId: string }
	| { type: 'lynt_edited'; lyntId: string; [key: string]: unknown }
	| { type: 'poll_update'; lyntId: string; [key: string]: unknown }
	| { type: 'dm_message'; conversation_id: string; [key: string]: unknown }
	| { type: 'dm_typing_start' | 'dm_typing_stop'; conversationId: string }
	| { type: 'notification'; [key: string]: unknown };

type Listener = (event: WsEvent) => void;

let socket: WebSocket | null = null;
let reconnectDelay = 1000;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let manuallyClosed = false;
const listeners = new Set<Listener>();

export function onWsEvent(fn: Listener): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function connectWs() {
	manuallyClosed = false;
	if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
		return;
	}

	connectionState.set('reconnecting');
	socket = new WebSocket(WS_URL);

	socket.addEventListener('open', () => {
		reconnectDelay = 1000;
		connectionState.set('connected');
		heartbeatTimer = setInterval(() => {
			if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }));
		}, 25000);
	});

	socket.addEventListener('message', (raw) => {
		let event: WsEvent;
		try {
			event = JSON.parse(raw.data);
		} catch {
			return;
		}

		if (event.type === 'notification') {
			unread.update((u) => ({ ...u, notifications: u.notifications + 1 }));
		} else if (event.type === 'dm_message') {
			unread.update((u) => ({ ...u, messages: u.messages + 1 }));
		}

		for (const fn of listeners) fn(event);
	});

	socket.addEventListener('close', () => {
		if (heartbeatTimer) clearInterval(heartbeatTimer);
		if (manuallyClosed) {
			connectionState.set('offline');
			return;
		}
		connectionState.set('reconnecting');
		reconnectTimer = setTimeout(connectWs, reconnectDelay);
		reconnectDelay = Math.min(reconnectDelay * 2, 30000);
	});

	socket.addEventListener('error', () => {
		socket?.close();
	});
}

export function disconnectWs() {
	manuallyClosed = true;
	if (reconnectTimer) clearTimeout(reconnectTimer);
	if (heartbeatTimer) clearInterval(heartbeatTimer);
	socket?.close();
	socket = null;
	connectionState.set('offline');
}

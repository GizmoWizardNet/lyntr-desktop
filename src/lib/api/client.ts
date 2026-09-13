import { API_BASE } from './config';

export class ApiError extends Error {
	constructor(
		public status: number,
		message: string
	) {
		super(message);
	}
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${API_BASE}${path}`, {
		...init,
		credentials: 'include',
		headers: {
			...(init?.body ? { 'Content-Type': 'application/json' } : {}),
			...init?.headers
		}
	});

	if (!res.ok) {
		let message = res.statusText;
		try {
			const body = await res.json();
			message = body?.error ?? message;
		} catch {
			// non-JSON error body — fall back to statusText
		}
		throw new ApiError(res.status, message);
	}

	if (res.status === 204) return undefined as T;
	return res.json();
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
	request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

export interface Me {
	id: string;
	username: string;
	handle: string;
	created_at: string;
	iq: number;
	login_streak: number;
	is_admin: boolean;
	lynt_coins: number;
	default_feed: string;
	custom_font: string | null;
}

export interface Lynt {
	id: string;
	content: string;
	created_at: string;
	user_id: string;
	username: string;
	handle: string;
	verified: boolean;
	iq: number;
	name_color: string | null;
	views: number;
	likeCount: number;
	repost_count: number;
	comment_count: number;
	liked_by_user: boolean;
	reposted_by_user: boolean;
	images?: { key: string; position: number }[];
	poll?: {
		id: string;
		title: string;
		multi_select: boolean;
		options: { id: string; text: string; position: number; votes: number }[];
		my_votes: string[];
		total_votes: number;
	} | null;
}

export type FeedTab = 'For you' | 'Following' | 'Live' | 'New' | 'Liked' | 'Bookmarked';

export function getFeed(opts: { type?: FeedTab; handle?: string; before?: string } = {}) {
	const params = new URLSearchParams();
	if (opts.type) params.set('type', opts.type);
	if (opts.handle) params.set('handle', opts.handle);
	if (opts.before) params.set('before', opts.before);
	return get<Lynt[]>(`/api/feed?${params}`);
}

export function getMe() {
	return get<Me>('/api/me');
}

export interface PublicProfile {
	id: string;
	handle: string;
	created_at: string;
	username: string;
	iq: number;
	verified: boolean;
	followers: number;
	following: number;
	bio: string | null;
	banner: string | null;
	is_admin: boolean;
	contributor: boolean;
	login_streak: number;
	name_color: string | null;
	lynt_coins: number;
	aura_score: number;
	pinned_achievement_key: string | null;
	status_text: string | null;
	status_expires_at: string | null;
	achievements: { key: string; unlocked_at: string }[];
	viewer_follows: boolean;
}

export function getProfileByHandle(handle: string) {
	return get<PublicProfile>(`/api/profile/${encodeURIComponent(handle)}`);
}

export function createLynt(content: string) {
	return post<Lynt>('/api/lynt', { content });
}

export function likeLynt(lyntId: string) {
	return post<{ liked: boolean; likeCount: number }>('/api/likelynt', { lyntId });
}

export function bookmarkLynt(lyntId: string) {
	return post<{ bookmarked: boolean }>('/api/bookmark', { lyntId });
}

export function followUser(userId: string) {
	return post<{ following: boolean }>('/api/follow', { userId });
}

export interface NotificationRow {
	id: string;
	type: string;
	sourceUserId: string | null;
	sourceUser: string | null;
	sourceUserHandle: string | null;
	sourceUserVerified: boolean | null;
	lyntContent: string | null;
	lyntId: string | null;
	forumThreadId: string | null;
	forumThreadTitle: string | null;
	read: boolean;
	createdAt: string;
	mentionCount: number | null;
}

export function getNotifications() {
	return get<NotificationRow[]>('/api/notifications');
}

export function getUnreadNotificationCount() {
	return get<{ count: number }>('/api/notifications/unread');
}

export interface DmConversation {
	conversation_id: string;
	is_group: boolean;
	display_name: string;
	avatar_url: string | null;
	last_message_at: string | null;
	unread_count: number;
	muted: boolean;
	pinned: boolean;
}

export interface DmMessage {
	id: string;
	conversation_id: string;
	sender_id: string;
	content: string;
	created_at: string;
	reactions?: Record<string, number>;
}

export function getDmConversations() {
	return get<DmConversation[]>('/api/dm/conversations');
}

export function getDmMessages(conversationId: string, before?: string) {
	const params = new URLSearchParams({ conversation_id: conversationId });
	if (before) params.set('before', before);
	return get<DmMessage[]>(`/api/dm/messages?${params}`);
}

export function sendDmMessage(conversationId: string, content: string) {
	return post<DmMessage>('/api/dm/messages', { conversation_id: conversationId, content });
}

export interface AchievementRow {
	key: string;
	name: string;
	description: string;
	tier: 'bronze' | 'silver' | 'gold';
	coinReward: number;
	icon: string;
	family?: string;
	level?: number;
	secret?: boolean;
	unlocked: boolean;
	unlockedAt: string | null;
	seenAt: string | null;
	claimedAt: string | null;
	rarityPercent: number;
}

export function getAchievements() {
	return get<{
		achievements: AchievementRow[];
		unlockedCount: number;
		totalCount: number;
		pinnedKey: string | null;
	}>('/api/achievements');
}

export function claimAchievement(key: string) {
	return post<{ claimed: boolean; amount: number }>('/api/achievements/claim', { key });
}

export type LeaderboardCategory = 'iq' | 'followers' | 'forum' | 'networth' | 'achievements';

export interface LeaderboardEntry {
	rank: number;
	userId: string;
	username: string;
	handle: string;
	value: number;
}

export function getLeaderboard(category: LeaderboardCategory, limit = 10, offset = 0) {
	return get<{
		category: LeaderboardCategory;
		entries: LeaderboardEntry[];
		limit: number;
		offset: number;
		hasMore: boolean;
	}>(`/api/leaderboard?category=${category}&limit=${limit}&offset=${offset}`);
}

export function getLeaderboardTop3() {
	return get<Record<LeaderboardCategory, LeaderboardEntry[]>>('/api/leaderboard/top3');
}

export interface ForumCategory {
	id: string;
	name: string;
	slug: string;
	thread_count: number;
	post_count: number;
	last_activity_at: string | null;
}

export interface ForumThread {
	id: string;
	title: string;
	category_id: string;
	pinned: boolean;
	created_at: string;
	username: string;
	handle: string;
	reply_count: number;
	score: number;
}

export function getForumCategories() {
	return get<ForumCategory[]>('/api/forum/categories');
}

export function getForumThreads(opts: { category?: string; sort?: 'active' | 'new' | 'top' } = {}) {
	const params = new URLSearchParams();
	if (opts.category) params.set('category', opts.category);
	if (opts.sort) params.set('sort', opts.sort);
	return get<ForumThread[]>(`/api/forum/threads?${params}`);
}

export function getForumThread(id: string) {
	return get<{ thread: ForumThread; posts: unknown[] }>(`/api/forum/threads/${id}`);
}

export interface ShopLyntskin {
	key: string;
	name: string;
	price: number;
	file: string;
	owned: boolean;
}

export function getShopLyntskins() {
	return get<{ balance: number; skins: ShopLyntskin[] }>('/api/shop/lyntskins');
}

export function purchaseLyntskin(key: string) {
	return post<{ purchased: boolean; balance: number }>('/api/shop/lyntskins/purchase', { key });
}
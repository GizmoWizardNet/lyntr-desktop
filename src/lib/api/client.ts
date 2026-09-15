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
	const isFormBody = init?.body instanceof FormData;
	const desktopToken =
		typeof sessionStorage !== 'undefined'
			? sessionStorage.getItem('lyntr-desktop-token')
			: null;

	console.log('[Lyntr Desktop] API request:', {
		path,
		hasDesktopToken: Boolean(desktopToken),
		tokenLength: desktopToken?.length ?? 0
	});
	
	const res = await fetch(`${API_BASE}${path}`, {
		...init,
		credentials: 'include',
		headers: {
			...(init?.body && !isFormBody
				? { 'Content-Type': 'application/json' }
				: {}),

			...(desktopToken
				? {
					Authorization: `Bearer ${desktopToken}`
				}
				: {}),

			...init?.headers
		}
	});

	if (!res.ok) {
		let message = res.statusText;
		try {
			const body = await res.json();
			message = body?.error ?? message;
		} catch {
		}
		throw new ApiError(res.status, message);
	}

	if (res.status === 204) return undefined as T;
	return res.json();
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
	request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' });
const postForm = <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form });
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
	return get<{ lynts: Lynt[] }>(`/api/feed?${params}`).then((r) => r.lynts);
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
	const form = new FormData();
	form.set('content', content);
	return postForm<Lynt>('/api/lynt', form);
}

export function likeLynt(lyntId: string) {
	return post<{ message: string }>('/api/likelynt', { lyntId });
}

export function isLyntBookmarked(lyntId: string) {
	return get<{ bookmarked: boolean }>(`/api/bookmark?id=${encodeURIComponent(lyntId)}`);
}

export function addBookmark(lyntId: string) {
	return post<{ message: string }>('/api/bookmark', { lyntId });
}

export function removeBookmark(lyntId: string) {
	return del<{ message: string }>(`/api/bookmark?id=${encodeURIComponent(lyntId)}`);
}

export async function followUser(userId: string) {
	const res = await post<{ message: string }>('/api/follow', { userId });
	return { following: res.message.startsWith('Followed') };
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
export interface DmConversationMember {
	user_id: string;
	username: string;
	handle: string;
	name_color: string | null;
	verified: boolean;
}

export interface DmConversation {
	id: string;
	status: 'pending' | 'active' | string;
	is_group: boolean;
	name: string | null;
	icon_url: string | null;
	owner_id: string | null;
	last_message_at: string | null;
	last_message_preview: string | null;
	created_at: string;
	muted: boolean;
	pinned: boolean;
	unread: number;
	other_user: DmConversationMember | null;
	members?: DmConversationMember[];
}

export function dmDisplayName(c: DmConversation): string {
	if (c.is_group) return c.name ?? 'Group chat';
	return c.other_user?.username ?? 'Unknown user';
}

export interface DmMessage {
	id: string;
	conversation_id: string;
	sender_id: string;
	content: string | null;
	gif_url?: string | null;
	gif_preview_url?: string | null;
	attachment_url?: string | null;
	attachment_name?: string | null;
	created_at: string;
	reactions: { emoji: string; count: number; me: boolean }[];
	reply_to: { id: string; content: string | null; sender_id: string } | null;
}

export function getDmConversations() {
	return get<DmConversation[]>('/api/dm/conversations');
}

export function getDmMessages(conversationId: string, before?: string) {
	const params = new URLSearchParams({ conversation_id: conversationId });
	if (before) params.set('before', before);
	return get<{ conversation: unknown; messages: DmMessage[] }>(`/api/dm/messages?${params}`).then(
		(r) => r.messages
	);
}

export function sendDmMessage(conversationId: string, content: string) {
	const form = new FormData();
	form.set('conversation_id', conversationId);
	form.set('content', content);
	return postForm<DmMessage>('/api/dm/messages', form);
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
	description: string | null;
	sortOrder: number;
	threadCount: number;
	postCount: number;
	lastActivityAt: string | null;
}

export interface ForumThread {
	id: string;
	title: string;
	categoryId: string;
	pinned: boolean;
	closed?: boolean;
	views?: number;
	createdAt: string;
	lastActivityAt?: string | null;
	userId?: string | null;
	username: string;
	handle: string;
	verified?: boolean;
	replyCount: number;
	score: number;
}

export interface ForumPost {
	id: string;
	threadId: string;
	content: string;
	isOp: boolean;
	createdAt: string;
	editedAt: string | null;
	deleted: boolean;
	userId: string | null;
	handle: string | null;
	username: string | null;
	verified: boolean | null;
	isAdmin?: boolean | null;
	contributor?: boolean | null;
	loginStreak?: number | null;
	nameColor: string | null;
	score: number;
	upvotes: number;
	downvotes: number;
	viewerVote: number;
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
	return get<{ thread: ForumThread; posts: ForumPost[]; viewerIsAdmin: boolean }>(
		`/api/forum/threads/${id}`
	);
}

export function createForumThread(categoryId: string, title: string, content: string) {
	return post<ForumThread & { firstPostId: string }>('/api/forum/threads', {
		categoryId,
		title,
		content
	});
}

export function createForumPost(threadId: string, content: string) {
	return post<ForumPost>('/api/forum/posts', { threadId, content });
}

export function voteForumPost(postId: string, value: 1 | -1 | 0) {
	return post<{ postId: string; viewerVote: number; score: number; upvotes: number; downvotes: number }>(
		`/api/forum/posts/${postId}/vote`,
		{ value }
	);
}

export interface Scrollable {
	id: string;
	userId: string;
	caption: string | null;
	videoKey: string;
	thumbnailKey: string | null;
	durationSeconds: number;
	fileSizeBytes: number;
	views: number;
	createdAt: string;
	username: string;
	handle: string;
	verified: boolean;
	isAdmin: boolean;
	contributor: boolean;
	nameColor: string | null;
	authorIq: number;
	likeCount: number;
	bookmarkCount: number;
	commentCount: number;
	liked: boolean;
	bookmarked: boolean;
}

export function getScrollables(opts: { before?: string; minIq?: number } = {}) {
	const params = new URLSearchParams();
	if (opts.before) params.set('before', opts.before);
	if (opts.minIq !== undefined) params.set('minIq', String(opts.minIq));
	return get<{ scrollables: Scrollable[] }>(`/api/scrollables?${params}`).then((r) => r.scrollables);
}

export function toggleScrollableLike(id: string) {
	return post<{ liked: boolean; likeCount: number }>(`/api/scrollables/${id}/like`);
}

export function toggleScrollableBookmark(id: string) {
	return post<{ bookmarked: boolean }>(`/api/scrollables/${id}/bookmark`);
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
	return post<{ purchased: string }>('/api/shop/lyntskins/purchase', { key });
}
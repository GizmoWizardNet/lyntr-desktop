<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getFeed,
		createLynt,
		likeLynt,
		isLyntBookmarked,
		addBookmark,
		removeBookmark,
		type Lynt
	} from '$lib/api/client';
	import { onWsEvent } from '$lib/api/ws';
	import { currentUser } from '$lib/stores/session';

	let lynts = $state<Lynt[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let draft = $state('');
	let posting = $state(false);

	let bookmarked = $state<Record<string, boolean>>({});

	async function load() {
		loading = true;
		error = null;
		try {
			lynts = await getFeed({ type: 'For you' });
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load the feed.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		return onWsEvent((event) => {
			if (event.type === 'like_update') {
				lynts = lynts.map((l) =>
					l.id === event.lyntId
						? {
								...l,
								likeCount: event.likeCount,
								liked_by_user: 'liked' in event ? Boolean(event.liked) : l.liked_by_user
							}
						: l
				);
			} else if (event.type === 'comment_count_update') {
				lynts = lynts.map((l) =>
					l.id === event.lyntId ? { ...l, comment_count: event.commentCount } : l
				);
			} else if (event.type === 'repost_update') {
				lynts = lynts.map((l) =>
					l.id === event.lyntId ? { ...l, repost_count: event.repostCount } : l
				);
			} else if (event.type === 'lynt_deleted') {
				lynts = lynts.filter((l) => l.id !== event.lyntId);
			}
		});
	});

	async function toggleLike(lynt: Lynt) {
		const wasLiked = lynt.liked_by_user;
		lynt.liked_by_user = !wasLiked;
		lynt.likeCount += wasLiked ? -1 : 1;
		lynts = [...lynts];
		try {
			await likeLynt(lynt.id);
		} catch {
			lynt.liked_by_user = wasLiked;
			lynt.likeCount += wasLiked ? 1 : -1;
			lynts = [...lynts];
		}
	}

	async function isBookmarked(lyntId: string): Promise<boolean> {
		if (lyntId in bookmarked) return bookmarked[lyntId];
		try {
			const res = await isLyntBookmarked(lyntId);
			bookmarked = { ...bookmarked, [lyntId]: res.bookmarked };
			return res.bookmarked;
		} catch {
			return false;
		}
	}

	async function toggleBookmark(lynt: Lynt) {
		const current = await isBookmarked(lynt.id);
		const next = !current;
		bookmarked = { ...bookmarked, [lynt.id]: next }; // optimistic
		try {
			if (next) await addBookmark(lynt.id);
			else await removeBookmark(lynt.id);
		} catch {
			bookmarked = { ...bookmarked, [lynt.id]: current }; // roll back
		}
	}

	async function submitPost() {
		if (!draft.trim() || posting) return;
		posting = true;
		try {
			const created = await createLynt(draft.trim());
			const me = $currentUser;
			lynts = [
				{
					...created,
					username: me?.username ?? '',
					handle: me?.handle ?? '',
					verified: false,
					views: 0,
					likeCount: 0,
					repost_count: 0,
					comment_count: 0,
					liked_by_user: false,
					reposted_by_user: false
				} as Lynt,
				...lynts
			];
			draft = '';
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to post.';
		} finally {
			posting = false;
		}
	}

	function handleComposerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
			e.preventDefault();
			submitPost();
		}
	}

	function timeAgo(iso: string): string {
		const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h`;
		return `${Math.floor(hours / 24)}d`;
	}
</script>

<div class="mx-auto max-w-3xl p-6">
	<div class="lynt-card p-4">
		<textarea
			bind:value={draft}
			onkeydown={handleComposerKeydown}
			rows="2"
			placeholder="What's happening?"
			class="w-full resize-none !border-none !bg-transparent !shadow-none text-sm placeholder:text-muted-foreground focus:outline-none"
		></textarea>
		<div class="mt-2 flex items-center justify-between">
			<span class="text-xs text-muted-foreground">Ctrl + Enter to post</span>
			<button
				class="bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
				disabled={!draft.trim() || posting}
				onclick={submitPost}
			>
				{posting ? 'Posting…' : 'Post'}
			</button>
		</div>
	</div>

	{#if error}
		<div class="lynt-card mt-4 p-4 text-sm" style="color: hsl(var(--destructive));">
			{error}
			<button class="ml-2 underline" onclick={load}>Retry</button>
		</div>
	{/if}

	{#if loading}
		<div class="mt-6 text-center text-sm text-muted-foreground">Loading feed…</div>
	{:else if lynts.length === 0 && !error}
		<div class="mt-6 text-center text-sm text-muted-foreground">
			Nothing here yet — follow people or post the first lynt.
		</div>
	{:else}
		<div class="mt-4 flex flex-col gap-4">
			{#each lynts as lynt (lynt.id)}
				<article class="lynt-card p-4">
					<div class="flex items-center gap-2 text-sm">
						<div class="grid h-9 w-9 place-items-center rounded-full bg-secondary font-semibold text-foreground">
							{lynt.username?.[0]?.toUpperCase() ?? '?'}
						</div>
						<div>
							<span class="font-semibold text-foreground">{lynt.username}</span>
							<span class="text-muted-foreground">@{lynt.handle} · {timeAgo(lynt.created_at)}</span>
						</div>
					</div>
					<p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{lynt.content}</p>
					{#if lynt.images?.length}
						<div class="mt-2 grid grid-cols-2 gap-1 overflow-hidden rounded" style="box-shadow: var(--inset-shadow);">
							{#each lynt.images as img (img.key)}
								<img src={img.key} alt="" class="h-40 w-full object-cover" loading="lazy" />
							{/each}
						</div>
					{/if}
					<div class="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
						<button class="flex items-center gap-1.5">
							💬 {lynt.comment_count}
						</button>
						<button
							class="flex items-center gap-1.5"
							style={lynt.reposted_by_user ? 'color: hsl(var(--accent-green))' : ''}
						>
							🔁 {lynt.repost_count}
						</button>
						<button
							class="flex items-center gap-1.5"
							style={lynt.liked_by_user ? 'color: hsl(var(--accent-rose))' : ''}
							onclick={() => toggleLike(lynt)}
						>
							{lynt.liked_by_user ? '♥' : '♡'} {lynt.likeCount}
						</button>
						<button
							class="ml-auto"
							onclick={() => toggleBookmark(lynt)}
							title="Bookmark"
							style={bookmarked[lynt.id] ? 'color: hsl(var(--accent-amber))' : ''}
						>
							🔖
						</button>
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
<script lang="ts">
	import { onMount } from 'svelte';
	import { getScrollables, toggleScrollableLike, toggleScrollableBookmark, type Scrollable } from '$lib/api/client';
	import { scrollableUrl } from '$lib/api/config';
	import { Heart, MessageCircle, Bookmark, Volume2, VolumeX } from 'lucide-svelte';

	let clips = $state<Scrollable[]>([]);
	let index = $state(0);
	let muted = $state(true);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			clips = await getScrollables();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load scrollables.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	function next() {
		index = Math.min(index + 1, clips.length - 1);
	}
	function prev() {
		index = Math.max(index - 1, 0);
	}

	async function like(clip: Scrollable) {
		const prevLiked = clip.liked;
		const prevCount = clip.likeCount;
		clip.liked = !prevLiked;
		clip.likeCount += prevLiked ? -1 : 1;
		clips = [...clips];
		try {
			const res = await toggleScrollableLike(clip.id);
			clip.liked = res.liked;
			clip.likeCount = res.likeCount;
			clips = [...clips];
		} catch {
			clip.liked = prevLiked;
			clip.likeCount = prevCount;
			clips = [...clips];
		}
	}

	async function bookmark(clip: Scrollable) {
		const prev = clip.bookmarked;
		clip.bookmarked = !prev;
		clips = [...clips];
		try {
			const res = await toggleScrollableBookmark(clip.id);
			clip.bookmarked = res.bookmarked;
			clips = [...clips];
		} catch {
			clip.bookmarked = prev;
			clips = [...clips];
		}
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'ArrowDown' || e.key === 'j') next();
		if (e.key === 'ArrowUp' || e.key === 'k') prev();
		if (e.key === 'm') muted = !muted;
	}}
/>

<div class="flex h-full items-center justify-center gap-3 p-6">
	{#if loading}
		<p class="text-sm text-muted-foreground">Loading…</p>
	{:else if error}
		<div class="lynt-card p-4 text-sm" style="color: hsl(var(--destructive));">
			{error}
			<button class="ml-2 underline" onclick={load}>Retry</button>
		</div>
	{:else if clips.length === 0}
		<p class="text-sm text-muted-foreground">No scrollables yet.</p>
	{:else}
		{@const clip = clips[index]}
		<div
			class="relative flex h-full max-h-[720px] w-full max-w-[380px] flex-col justify-end overflow-hidden rounded-lg bg-black text-white"
			style="box-shadow: var(--hard-shadow);"
		>
			<!-- key on clip.id so the <video> element (and its playback) resets on navigation -->
			{#key clip.id}
				<video
					src={scrollableUrl(`${clip.videoKey}.mp4`)}
					poster={clip.thumbnailKey ? scrollableUrl(`${clip.thumbnailKey}.webp`) : undefined}
					class="absolute inset-0 h-full w-full object-cover"
					autoplay
					loop
					{muted}
					playsinline
				></video>
			{/key}

			<div class="absolute right-3 top-3 flex flex-col gap-2">
				<button
					class="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-sm"
					onclick={() => (muted = !muted)}
					title={muted ? 'Unmute' : 'Mute'}
				>
					{#if muted}
						<VolumeX class="h-4 w-4" />
					{:else}
						<Volume2 class="h-4 w-4" />
					{/if}
				</button>
			</div>

			<div class="absolute right-3 bottom-24 flex flex-col items-center gap-4 text-sm">
				<button class="flex flex-col items-center gap-1" onclick={() => like(clip)}>
					<span
						class="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-lg"
						style={clip.liked ? 'color: hsl(var(--accent-rose));' : ''}
					>
						<Heart class="h-5 w-5" fill={clip.liked ? 'currentColor' : 'none'} />
					</span>
					{clip.likeCount}
				</button>
				<button class="flex flex-col items-center gap-1">
					<span class="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-lg">
						<MessageCircle class="h-5 w-5" />
					</span>
					{clip.commentCount}
				</button>
				<button class="flex flex-col items-center gap-1" onclick={() => bookmark(clip)}>
					<span
						class="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-lg"
						style={clip.bookmarked ? 'color: hsl(var(--accent-amber));' : ''}
					>
						<Bookmark class="h-5 w-5" fill={clip.bookmarked ? 'currentColor' : 'none'} />
					</span>
					{clip.bookmarkCount}
				</button>
			</div>

			<div class="bg-gradient-to-t from-black/70 to-transparent p-4 pt-16">
				<p class="text-sm font-semibold">@{clip.handle}</p>
				{#if clip.caption}<p class="text-sm">{clip.caption}</p>{/if}
			</div>
		</div>

		<div class="flex flex-col gap-2">
			<button
				class="grid h-9 w-9 place-items-center text-muted-foreground disabled:opacity-30"
				style="background: hsl(var(--input)); box-shadow: var(--inset-shadow); border-radius: 5px;"
				onclick={prev}
				disabled={index === 0}
				title="Previous (K)"
			>
				↑
			</button>
			<button
				class="grid h-9 w-9 place-items-center text-muted-foreground disabled:opacity-30"
				style="background: hsl(var(--input)); box-shadow: var(--inset-shadow); border-radius: 5px;"
				onclick={next}
				disabled={index === clips.length - 1}
				title="Next (J)"
			>
				↓
			</button>
		</div>
	{/if}
</div>
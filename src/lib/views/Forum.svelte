<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getForumCategories,
		getForumThreads,
		type ForumCategory,
		type ForumThread
	} from '$lib/api/client';
	import { Pin } from 'lucide-svelte';

	let categories = $state<ForumCategory[]>([]);
	let activeCategorySlug = $state<string | null>(null);
	let threads = $state<ForumThread[]>([]);
	let loadingCategories = $state(true);
	let loadingThreads = $state(false);
	let error = $state<string | null>(null);

	async function loadCategories() {
		loadingCategories = true;
		error = null;
		try {
			categories = await getForumCategories();
			if (categories.length > 0) activeCategorySlug = categories[0].slug;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load forum categories.';
		} finally {
			loadingCategories = false;
		}
	}

	async function loadThreads(slug: string) {
		loadingThreads = true;
		error = null;
		try {
			threads = await getForumThreads({ category: slug, sort: 'active' });
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load threads.';
		} finally {
			loadingThreads = false;
		}
	}

	onMount(loadCategories);
	$effect(() => {
		if (activeCategorySlug) loadThreads(activeCategorySlug);
	});
</script>

<div class="grid h-full grid-cols-[220px_minmax(0,1fr)]">
	<div class="border-r-2 p-3" style="border-right-color: var(--bevel-dark);">
		<h2 class="mb-2 px-1 font-display text-xs font-bold uppercase text-muted-foreground">Categories</h2>
		{#if loadingCategories}
			<p class="px-1 text-xs text-muted-foreground">Loading…</p>
		{:else}
			<ul class="space-y-1">
				{#each categories as cat (cat.id)}
					<li>
						<button
							class="flex w-full items-center justify-between px-2.5 py-1.5 text-left text-sm {activeCategorySlug ===
							cat.slug
								? 'bg-primary text-primary-foreground'
								: 'text-foreground hover:bg-accent'}"
							style="border-radius: 5px;"
							onclick={() => (activeCategorySlug = cat.slug)}
						>
							<span>{cat.name}</span>
							<span class="text-[10px] opacity-70">{cat.thread_count}</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="overflow-y-auto p-4">
		{#if error}
			<div class="lynt-card p-4 text-sm" style="color: hsl(var(--destructive));">
				{error}
				<button class="ml-2 underline" onclick={loadCategories}>Retry</button>
			</div>
		{:else if loadingThreads}
			<div class="text-center text-sm text-muted-foreground">Loading threads…</div>
		{:else if threads.length === 0}
			<div class="text-center text-sm text-muted-foreground">No threads in this category yet.</div>
		{:else}
			<ul class="space-y-2">
				{#each threads as t (t.id)}
					<li class="lynt-card flex items-center justify-between p-3">
						<div class="min-w-0">
							<div class="flex items-center gap-2">
								{#if t.pinned}
									<span style="color: hsl(var(--accent-amber));"><Pin class="h-3.5 w-3.5" /></span>
								{/if}
								<span class="truncate text-sm font-medium text-foreground">{t.title}</span>
							</div>
							<span class="text-xs text-muted-foreground">by {t.username}</span>
						</div>
						<span class="shrink-0 text-xs text-muted-foreground">{t.reply_count} replies</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

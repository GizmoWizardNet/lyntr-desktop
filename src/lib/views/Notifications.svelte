<script lang="ts">
	import { onMount } from 'svelte';
	import { getNotifications, type NotificationRow } from '$lib/api/client';
	import { onWsEvent } from '$lib/api/ws';
	import { unread } from '$lib/stores/app';

	let items = $state<NotificationRow[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	function describe(n: NotificationRow): string {
		const who = n.sourceUser ?? 'Someone';
		switch (n.type) {
			case 'like':
				return `${who} liked your lynt.`;
			case 'reply':
				return `${who} replied to your lynt.`;
			case 'repost':
				return `${who} reposted your lynt.`;
			case 'follow':
				return `${who} followed you.`;
			case 'mention':
				return `${who} mentioned you${n.mentionCount && n.mentionCount > 1 ? ` (${n.mentionCount}×)` : ''}.`;
			case 'forum_reply':
				return `${who} replied on "${n.forumThreadTitle ?? 'a thread'}".`;
			default:
				return n.type.replace(/_/g, ' ');
		}
	}

	async function load() {
		loading = true;
		error = null;
		try {
			items = await getNotifications();
			unread.update((u) => ({ ...u, notifications: items.filter((n) => !n.read).length }));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load notifications.';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		load();
		return onWsEvent((event) => {
			if (event.type === 'notification') load();
		});
	});
</script>

<div class="mx-auto max-w-2xl p-6">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="font-display text-lg font-bold text-foreground">Notifications</h1>
	</div>

	{#if loading}
		<div class="text-center text-sm text-muted-foreground">Loading…</div>
	{:else if error}
		<div class="lynt-card p-4 text-sm" style="color: hsl(var(--destructive));">
			{error}
			<button class="ml-2 underline" onclick={load}>Retry</button>
		</div>
	{:else if items.length === 0}
		<div class="text-center text-sm text-muted-foreground">You're all caught up.</div>
	{:else}
		<ul class="lynt-card divide-y divide-border overflow-hidden">
			{#each items as n (n.id)}
				<li class="flex items-center gap-3 px-4 py-3">
					{#if !n.read}
						<span class="h-2 w-2 shrink-0 rounded-full bg-primary"></span>
					{:else}
						<span class="h-2 w-2 shrink-0"></span>
					{/if}
					<p class="flex-1 text-sm text-foreground">{describe(n)}</p>
					<span class="shrink-0 text-xs text-muted-foreground">
						{new Date(n.createdAt).toLocaleDateString()}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

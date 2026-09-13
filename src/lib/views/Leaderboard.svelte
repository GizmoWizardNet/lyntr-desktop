<script lang="ts">
	import { onMount } from 'svelte';
	import { getLeaderboard, type LeaderboardCategory, type LeaderboardEntry } from '$lib/api/client';

	const categories: { id: LeaderboardCategory; label: string }[] = [
		{ id: 'iq', label: 'IQ' },
		{ id: 'followers', label: 'Followers' },
		{ id: 'forum', label: 'Forum' },
		{ id: 'networth', label: 'Net worth' },
		{ id: 'achievements', label: 'Achievements' }
	];

	let category = $state<LeaderboardCategory>('iq');
	let entries = $state<LeaderboardEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await getLeaderboard(category, 20, 0);
			entries = res.entries;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load the leaderboard.';
		} finally {
			loading = false;
		}
	}

	onMount(load);
	$effect(() => {
		category;
		load();
	});

	const medalColor = ['hsl(45 90% 55%)', 'hsl(220 9% 70%)', 'hsl(28 55% 50%)'];
</script>

<div class="mx-auto max-w-2xl p-6">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="font-display text-lg font-bold text-foreground">Leaderboard</h1>
		<div class="flex flex-wrap justify-end gap-1">
			{#each categories as c (c.id)}
				<button
					class="px-3 py-1 text-xs font-semibold {category === c.id
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground'}"
					style={category === c.id
						? 'border-radius:5px'
						: 'background: hsl(var(--input)); box-shadow: var(--inset-shadow); border-radius:5px;'}
					onclick={() => (category = c.id)}
				>
					{c.label}
				</button>
			{/each}
		</div>
	</div>

	{#if loading}
		<div class="text-center text-sm text-muted-foreground">Loading…</div>
	{:else if error}
		<div class="lynt-card p-4 text-sm" style="color: hsl(var(--destructive));">
			{error}
			<button class="ml-2 underline" onclick={load}>Retry</button>
		</div>
	{:else if entries.length === 0}
		<div class="text-center text-sm text-muted-foreground">No entries yet.</div>
	{:else}
		<ol class="lynt-card divide-y divide-border overflow-hidden">
			{#each entries as row, i (row.userId)}
				<li class="flex items-center gap-3 px-4 py-3">
					<span
						class="w-6 shrink-0 text-center font-display text-sm font-bold"
						style={i < 3 ? `color: ${medalColor[i]}` : ''}
					>
						{row.rank}
					</span>
					<div class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary font-semibold">
						{row.username?.[0]?.toUpperCase() ?? '?'}
					</div>
					<div class="min-w-0 flex-1">
						<div class="truncate text-sm font-medium text-foreground">{row.username}</div>
						<div class="truncate text-xs text-muted-foreground">@{row.handle}</div>
					</div>
					<span class="shrink-0 font-display text-sm font-bold text-foreground">
						{row.value.toLocaleString()}
					</span>
				</li>
			{/each}
		</ol>
	{/if}
</div>

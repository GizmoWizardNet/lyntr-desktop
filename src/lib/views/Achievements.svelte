<script lang="ts">
	import { onMount } from 'svelte';
	import { getAchievements, claimAchievement, type AchievementRow } from '$lib/api/client';

	const tierColor: Record<string, string> = {
		bronze: 'hsl(28 45% 45%)',
		silver: 'hsl(220 9% 65%)',
		gold: 'hsl(45 90% 55%)'
	};

	let achievements = $state<AchievementRow[]>([]);
	let unlockedCount = $state(0);
	let totalCount = $state(0);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let claiming = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await getAchievements();
			achievements = res.achievements;
			unlockedCount = res.unlockedCount;
			totalCount = res.totalCount;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load achievements.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function claim(a: AchievementRow) {
		if (!a.unlocked || a.claimedAt || claiming) return;
		claiming = a.key;
		try {
			await claimAchievement(a.key);
			await load();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to claim.';
		} finally {
			claiming = null;
		}
	}
</script>

<div class="mx-auto max-w-3xl p-6">
	<div class="mb-5 flex items-center justify-between">
		<h1 class="font-display text-lg font-bold text-foreground">Achievements</h1>
		{#if !loading && !error}
			<span class="text-sm text-muted-foreground">{unlockedCount} / {totalCount} unlocked</span>
		{/if}
	</div>

	{#if loading}
		<div class="text-center text-sm text-muted-foreground">Loading…</div>
	{:else if error}
		<div class="lynt-card p-4 text-sm" style="color: hsl(var(--destructive));">
			{error}
			<button class="ml-2 underline" onclick={load}>Retry</button>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{#each achievements as a (a.key)}
				<div class="lynt-card flex items-center gap-3 p-3" class:opacity-50={!a.unlocked}>
					<div
						class="relative grid h-12 w-12 shrink-0 place-items-center rounded-full"
						style="box-shadow: var(--inset-shadow); border: 2px solid {tierColor[a.tier]};"
					>
						{#if a.unlocked && a.icon}
							<img src={`/achievements/${a.icon}`} alt={a.name} class="h-8 w-8 object-contain" />
						{:else}
							<span class="text-lg text-muted-foreground">?</span>
						{/if}
					</div>
					<div class="min-w-0 flex-1">
						<div class="flex items-center gap-2">
							<span class="truncate font-display text-sm font-bold text-foreground">{a.name}</span>
							<span
								class="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white"
								style="background: {tierColor[a.tier]};"
							>
								{a.tier}
							</span>
							<span class="ml-auto shrink-0 text-[10px] text-muted-foreground">{a.rarityPercent}% have this</span>
						</div>
						<p class="truncate text-xs text-muted-foreground">{a.description}</p>
					</div>
					{#if a.unlocked}
						<button
							class="shrink-0 bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
							disabled={!!a.claimedAt || claiming === a.key}
							onclick={() => claim(a)}
						>
							{a.claimedAt ? `+${a.coinReward} XP` : claiming === a.key ? '…' : `Claim +${a.coinReward}`}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

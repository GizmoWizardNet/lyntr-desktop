<script lang="ts">
	import { onMount } from 'svelte';
	import { getMe, type Me } from '$lib/api/client';

	let me = $state<Me | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			me = await getMe();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load your profile.';
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div class="mx-auto max-w-2xl p-6">
	{#if loading}
		<div class="text-center text-sm text-muted-foreground">Loading…</div>
	{:else if error}
		<div class="lynt-card p-4 text-sm" style="color: hsl(var(--destructive));">
			{error}
			<button class="ml-2 underline" onclick={load}>Retry</button>
		</div>
	{:else if me}
		<div class="lynt-card p-5">
			<div class="flex items-center gap-4">
				<div class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-secondary text-xl font-bold">
					{me.username[0]?.toUpperCase()}
				</div>
				<div>
					<span class="font-display text-base font-bold text-foreground">{me.username}</span>
					<div class="text-sm text-muted-foreground">@{me.handle}</div>
				</div>
			</div>

			<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
				<div class="lynt-card p-3 text-center">
					<div class="text-lg font-bold text-foreground">{me.iq}</div>
					<div class="text-xs text-muted-foreground">IQ</div>
				</div>
				<div class="lynt-card p-3 text-center">
					<div class="text-lg font-bold text-foreground">{me.lynt_coins.toLocaleString()}</div>
					<div class="text-xs text-muted-foreground">XP</div>
				</div>
				<div class="lynt-card p-3 text-center">
					<div class="text-lg font-bold text-foreground">🔥 {me.login_streak}</div>
					<div class="text-xs text-muted-foreground">Day streak</div>
				</div>
				<div class="lynt-card p-3 text-center">
					<div class="text-lg font-bold text-foreground">
						{new Date(me.created_at).getFullYear()}
					</div>
					<div class="text-xs text-muted-foreground">Joined</div>
				</div>
			</div>
		</div>

		<p class="mt-4 text-xs text-muted-foreground">
			Bio, avatar, follower counts, and verification badges live on the public profile page
			(<code>lyntr/src/routes/[handle]</code>), which is rendered through SvelteKit's page-data
			protocol rather than a plain JSON endpoint — there's no clean <code>/api/profile/:handle</code>
			GET to call from outside the SvelteKit app yet. Adding one (mirroring the fields that page's
			<code>+page.server.ts</code> already loads) is the one small backend addition needed to fill
			this screen in the rest of the way; everything above is real data from <code>/api/me</code>.
		</p>
	{/if}
</div>

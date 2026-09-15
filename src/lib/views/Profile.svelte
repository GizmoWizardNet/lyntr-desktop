<script lang="ts">
	import { onMount } from 'svelte';
	import { getMe, getProfileByHandle, type Me, type PublicProfile } from '$lib/api/client';
	import { avatarUrl, bannerUrl } from '$lib/api/config';
	import { Flame } from 'lucide-svelte';
	import { theme } from '$lib/stores/app';

	let me = $state<Me | null>(null);
	let profile = $state<PublicProfile | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			me = await getMe();
			profile = await getProfileByHandle(me.handle);
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
	{:else if me && profile}
		<div class="lynt-card overflow-hidden p-0">
			{#if profile.banner}
				<img src={bannerUrl(profile.banner)} alt="" class="h-32 w-full object-cover" />
			{:else}
				<div class="h-16 w-full bg-secondary"></div>
			{/if}

			<div class="p-5">
				<div class="-mt-12 flex items-end gap-4">
					<img
						src={avatarUrl(me.id)}
						alt={me.username}
						class="h-20 w-20 shrink-0 rounded-full border-4 object-cover"
						style="border-color: hsl(var(--card));"
					/>
					<div class="pb-1">
						<div class="flex items-center gap-1">
							<span class="font-display text-base font-bold text-foreground">{me.username}</span>
							{#if profile.verified}
								<img
									src={$theme === 'dark' ? '/white_mode_verified.png' : '/verified.png'}
									alt="Verified"
									title="Verified"
									class="h-4 w-4"
								/>
							{/if}
							{#if profile.is_admin}
								<img src="/admin_badge.png" alt="Admin" title="Admin" class="h-4 w-4" />
							{/if}
							{#if profile.contributor}
								<img src="/contributor.png" alt="Contributor" title="Contributor" class="h-4 w-4" />
							{/if}
						</div>
						<div class="text-sm text-muted-foreground">@{me.handle}</div>
					</div>
				</div>

				{#if profile.bio}
					<p class="mt-3 whitespace-pre-wrap text-sm text-foreground">{profile.bio}</p>
				{/if}

				{#if profile.status_text}
					<p class="mt-1 text-xs italic text-muted-foreground">{profile.status_text}</p>
				{/if}

				<div class="mt-4 flex gap-4 text-sm">
					<span><b class="text-foreground">{profile.following.toLocaleString()}</b> <span class="text-muted-foreground">Following</span></span>
					<span><b class="text-foreground">{profile.followers.toLocaleString()}</b> <span class="text-muted-foreground">Followers</span></span>
				</div>

				<div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div class="lynt-card p-3 text-center">
						<div class="text-lg font-bold text-foreground">{me.iq}</div>
						<div class="text-xs text-muted-foreground">IQ</div>
					</div>
					<div class="lynt-card p-3 text-center">
						<div class="text-lg font-bold text-foreground">{me.lynt_coins.toLocaleString()}</div>
						<div class="text-xs text-muted-foreground">LyntCoins</div>
					</div>
					<div class="lynt-card p-3 text-center">
						<div class="flex items-center justify-center gap-1 text-lg font-bold text-foreground">
							<Flame class="h-4 w-4" style="color: hsl(var(--accent-amber));" />
							{me.login_streak}
						</div>
						<div class="text-xs text-muted-foreground">Day streak</div>
					</div>
					<div class="lynt-card p-3 text-center">
						<div class="text-lg font-bold text-foreground">
							{new Date(me.created_at).getFullYear()}
						</div>
						<div class="text-xs text-muted-foreground">Joined</div>
					</div>
				</div>

				{#if profile.achievements.length > 0}
					<div class="mt-5">
						<div class="mb-2 text-xs font-semibold text-muted-foreground">
							Achievements ({profile.achievements.length})
						</div>
						<div class="flex flex-wrap gap-2">
							{#each profile.achievements as a (a.key)}
								<span
									class="lynt-card px-2 py-1 text-xs"
									class:font-bold={a.key === profile.pinned_achievement_key}
								>
									{a.key}
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
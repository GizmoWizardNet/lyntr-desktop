<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';
	import TitleBar from '$lib/components/TitleBar.svelte';
	import IconRail from '$lib/components/IconRail.svelte';
	import CommandPalette from '$lib/components/CommandPalette.svelte';
	import ConnectionBanner from '$lib/components/ConnectionBanner.svelte';
	import Login from '$lib/views/Login.svelte';
	import { activeNav } from '$lib/stores/app';
	import { authState, refreshSession } from '$lib/stores/session';

	let { children } = $props();

	onMount(() => {
		// Real session check against /api/me on launch — no mock "logged in"
		// state. See src/lib/stores/session.ts and the CORS prerequisite
		// noted in src/lib/api/client.ts / README.
		refreshSession().catch(() => {
			// Network/CORS failure before the backend prerequisite is set up —
			// treat as logged-out rather than crashing the shell.
			authState.set('unauthenticated');
		});
	});
</script>

<div class="app-shell flex h-screen w-screen flex-col bg-background text-foreground">
	<TitleBar />
	<ConnectionBanner />

	<div class="flex min-h-0 flex-1">
		{#if $authState === 'authenticated'}
			<IconRail />
		{/if}
		<main class="min-w-0 flex-1 overflow-y-auto">
			{#if $authState === 'checking'}
				<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
					Checking your session…
				</div>
			{:else if $authState === 'unauthenticated'}
				<Login />
			{:else}
				{@render children?.()}
			{/if}
		</main>
	</div>
</div>

{#if $authState === 'authenticated'}
	<CommandPalette />
{/if}

<svelte:head>
	<title>Lyntr — {$activeNav[0].toUpperCase()}{$activeNav.slice(1)}</title>
</svelte:head>

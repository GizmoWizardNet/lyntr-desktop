<script lang="ts">
	import { onMount } from "svelte";
	import "../app.css";
	import TitleBar from "$lib/components/TitleBar.svelte";
	import IconRail from "$lib/components/IconRail.svelte";
	import CommandPalette from "$lib/components/CommandPalette.svelte";
	import ConnectionBanner from "$lib/components/ConnectionBanner.svelte";
	import Login from "$lib/views/Login.svelte";
	import { activeNav } from "$lib/stores/app";
	import { authState, refreshSession } from "$lib/stores/session";
	import { handleDesktopAuthCallback } from "$lib/auth";
	import { initDeepLinkListener } from "$lib/desktop/deepLink";

	let { children } = $props();

	onMount(() => {
		let destroyed = false;

		initDeepLinkListener((url) => {
			if (destroyed) return;

			void handleDesktopAuthCallback(url);
		}).catch((error) => {
			console.error(
				"[Lyntr Desktop] Failed to initialize deep-link listener:",
				error,
			);
		});

		refreshSession().catch(() => {
			authState.set("unauthenticated");
		});

		return () => {
			destroyed = true;
		};
	});
</script>

<div
	class="app-shell flex h-screen w-screen flex-col bg-background text-foreground"
>
	<TitleBar />
	<ConnectionBanner />

	<div class="flex min-h-0 flex-1">
		{#if $authState === "authenticated"}
			<IconRail />
		{/if}
		<main class="min-w-0 flex-1 overflow-y-auto">
			{#if $authState === "checking"}
				<div
					class="flex h-full items-center justify-center text-sm text-muted-foreground"
				>
					Checking your session…
				</div>
			{:else if $authState === "unauthenticated"}
				<Login />
			{:else}
				{@render children?.()}
			{/if}
		</main>
	</div>
</div>

{#if $authState === "authenticated"}
	<CommandPalette />
{/if}

<svelte:head>
	<title>Lyntr — {$activeNav[0].toUpperCase()}{$activeNav.slice(1)}</title>
</svelte:head>

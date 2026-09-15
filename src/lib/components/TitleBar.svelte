<script lang="ts">
	import { onMount } from 'svelte';
	import { closeWindow, isWindowMaximized, minimizeWindow, toggleMaximizeWindow } from '$lib/native';
	import { connectionState, theme, toggleCommandPalette } from '$lib/stores/app';

	const logo = $derived($theme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg');

	let maximized = $state(false);

	onMount(async () => {
		maximized = await isWindowMaximized();
	});

	async function handleMaximize() {
		await toggleMaximizeWindow();
		maximized = await isWindowMaximized();
	}

	const statusLabel = $derived(
		{ connected: 'Connected', reconnecting: 'Reconnecting…', offline: 'Offline' }[
			$connectionState
		]
	);
	const statusColor = $derived(
		{
			connected: 'hsl(var(--accent-green))',
			reconnecting: 'hsl(var(--accent-amber))',
			offline: 'hsl(var(--destructive))'
		}[$connectionState]
	);
</script>

<header
	data-tauri-drag-region
	class="flex h-titlebar shrink-0 select-none items-center justify-between border-b-2 pl-3 pr-1"
	style="background: var(--header-bg); border-bottom-color: var(--bevel-dark); box-shadow: inset 0 1px 0 var(--header-border-top);"
>
	<div data-tauri-drag-region class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
		<button
			class="grid h-6 w-6 place-items-center rounded text-muted-foreground/70 hover:bg-accent hover:text-foreground"
			title="Back"
			onclick={() => history.back()}
		>
			<svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
		</button>
		<button
			class="grid h-6 w-6 place-items-center rounded text-muted-foreground/70 hover:bg-accent hover:text-foreground"
			title="Forward"
			onclick={() => history.forward()}
		>
			<svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2"
				stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
		</button>

		<div data-tauri-drag-region class="ml-1 flex items-center gap-2">
			<img src={logo} alt="Lyntr" class="h-4 w-auto" draggable="false" />
			<span class="h-1.5 w-1.5 rounded-full" style="background: {statusColor};" title={statusLabel}></span>
		</div>
	</div>

	<div data-tauri-drag-region class="flex-1"></div>

	<button
		class="mr-1 flex items-center gap-2 !rounded-[5px] !px-3 !py-1 text-xs text-muted-foreground"
		style="background: hsl(var(--input)); box-shadow: var(--inset-shadow);"
		onclick={toggleCommandPalette}
	>
		<svg viewBox="0 0 24 24" class="h-3.5 w-3.5" fill="none" stroke="currentColor" stroke-width="2"
			stroke-linecap="round" stroke-linejoin="round">
			<circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
		</svg>
		Search Lyntr…
		<kbd class="rounded border border-border bg-background px-1 py-0.5 text-[10px]">Ctrl K</kbd>
	</button>

	<div class="flex items-center">
		<button
			class="grid h-titlebar w-11 place-items-center text-muted-foreground transition-colors hover:bg-primary/10"
			title="Minimize"
			onclick={minimizeWindow}
		>
			<svg viewBox="0 0 12 12" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="1.4">
				<path d="M2 6h8" />
			</svg>
		</button>
		<button
			class="grid h-titlebar w-11 place-items-center text-muted-foreground transition-colors hover:bg-primary/10"
			title={maximized ? 'Restore' : 'Maximize'}
			onclick={handleMaximize}
		>
			{#if maximized}
				<svg viewBox="0 0 12 12" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="1.4">
					<path d="M3.5 2h5v5M2 4.5v5h5" stroke-linejoin="round" />
				</svg>
			{:else}
				<svg viewBox="0 0 12 12" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="1.4">
					<rect x="2" y="2" width="8" height="8" />
				</svg>
			{/if}
		</button>
		<button
			class="grid h-titlebar w-11 place-items-center text-muted-foreground transition-colors hover:bg-destructive hover:text-destructive-foreground"
			title="Close"
			onclick={closeWindow}
		>
			<svg viewBox="0 0 12 12" class="h-3 w-3" fill="none" stroke="currentColor" stroke-width="1.4">
				<path d="M2 2l8 8M10 2l-8 8" />
			</svg>
		</button>
	</div>
</header>

<script lang="ts">
	import { commandPaletteOpen, activeNav, type NavId } from '$lib/stores/app';

	type Command = { label: string; hint?: string; run: () => void };

	let query = $state('');
	let selected = $state(0);
	let inputEl: HTMLInputElement | undefined = $state();

	function go(id: NavId): void {
		activeNav.set(id);
		close();
	}

	const commands: Command[] = [
		{ label: 'Go Home', hint: 'G H', run: () => go('home') },
		{ label: 'Open Search', hint: 'G S', run: () => go('search') },
		{ label: 'Open Messages', hint: 'G M', run: () => go('messages') },
		{ label: 'Open Notifications', run: () => go('notifications') },
		{ label: 'Open Scrollables', run: () => go('scrollables') },
		{ label: 'Open Achievements', run: () => go('achievements') },
		{ label: 'Open Shop', run: () => go('shop') },
		{ label: 'Open Forum', run: () => go('forum') },
		{ label: 'Open Leaderboard', run: () => go('leaderboard') },
		{ label: 'Open Profile', hint: 'G P', run: () => go('profile') },
		{ label: 'Open Settings', run: () => go('settings') },
		{ label: 'Create Lynt', hint: 'Ctrl Enter', run: () => close() }
	];

	const filtered = $derived(
		query.trim().length === 0
			? commands
			: commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
	);

	function close() {
		commandPaletteOpen.set(false);
		query = '';
		selected = 0;
	}

	function onKeydown(e: KeyboardEvent) {
		if (!$commandPaletteOpen) return;
		if (e.key === 'Escape') {
			e.preventDefault();
			close();
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			selected = Math.min(selected + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			selected = Math.max(selected - 1, 0);
		} else if (e.key === 'Enter') {
			e.preventDefault();
			filtered[selected]?.run();
		}
	}

	$effect(() => {
		if ($commandPaletteOpen) {
			selected = 0;
			queueMicrotask(() => inputEl?.focus());
		}
	});
</script>

<svelte:window
	onkeydown={(e) => {
		if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			commandPaletteOpen.update((v) => !v);
		} else {
			onKeydown(e);
		}
	}}
/>

{#if $commandPaletteOpen}
	<div
		class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-28 animate-fade-in"
		onclick={close}
	>
		<div
			class="w-full max-w-lg animate-slide-up overflow-hidden border-2 bg-popover"
			style="border-top-color: var(--bevel-light); border-left-color: var(--bevel-light); border-bottom-color: var(--bevel-dark); border-right-color: var(--bevel-dark); box-shadow: var(--hard-shadow); border-radius: 5px;"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex items-center gap-2 border-b border-border px-3 py-2.5">
				<svg viewBox="0 0 24 24" class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor"
					stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
				</svg>
				<input
					bind:this={inputEl}
					bind:value={query}
					placeholder="Search Lyntr…"
					class="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
				/>
				<kbd class="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">Esc</kbd>
			</div>
			<ul class="max-h-80 overflow-y-auto p-1.5">
				{#each filtered as cmd, i (cmd.label)}
					<li>
						<button
							class="flex w-full items-center justify-between rounded-[4px] px-2.5 py-2 text-left text-sm
								{i === selected ? 'bg-gradient-gloss text-primary-foreground' : 'text-foreground hover:bg-accent'}"
							onmouseenter={() => (selected = i)}
							onclick={cmd.run}
						>
							<span>{cmd.label}</span>
							{#if cmd.hint}
								<kbd
									class="rounded border px-1.5 py-0.5 text-[10px]
									{i === selected ? 'border-primary-foreground/30' : 'border-border text-muted-foreground'}"
								>{cmd.hint}</kbd>
							{/if}
						</button>
					</li>
				{:else}
					<li class="px-2.5 py-6 text-center text-sm text-muted-foreground">No matches.</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

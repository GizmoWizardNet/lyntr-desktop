<script lang="ts">
	import { onMount } from 'svelte';
	import { getShopLyntskins, purchaseLyntskin, type ShopLyntskin } from '$lib/api/client';

	let skins = $state<ShopLyntskin[]>([]);
	let balance = $state(0);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selected = $state<ShopLyntskin | null>(null);
	let purchasing = $state(false);
	let purchaseError = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const res = await getShopLyntskins();
			skins = res.skins;
			balance = res.balance;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load the shop.';
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function purchase(skin: ShopLyntskin) {
		purchasing = true;
		purchaseError = null;
		try {
			const res = await purchaseLyntskin(skin.key);
			balance = res.balance;
			skins = skins.map((s) => (s.key === skin.key ? { ...s, owned: true } : s));
			selected = skins.find((s) => s.key === skin.key) ?? null;
		} catch (e) {
			purchaseError = e instanceof Error ? e.message : 'Purchase failed.';
		} finally {
			purchasing = false;
		}
	}
</script>

<div class="mx-auto max-w-5xl p-6">
	<div class="mb-5 flex items-center justify-between">
		<h1 class="font-display text-lg font-bold text-foreground">Lyntskins</h1>
		{#if !loading && !error}
			<div class="lynt-card flex items-center gap-2 px-3 py-1.5 text-sm font-semibold">
				<img src="/aura.png" alt="" class="h-4 w-4" />
				{balance.toLocaleString()} XP
			</div>
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
		<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
			{#each skins as skin (skin.key)}
				<button
					class="lynt-card group flex flex-col overflow-hidden p-0 text-left"
					onclick={() => {
						selected = skin;
						purchaseError = null;
					}}
				>
					<div class="aspect-video w-full overflow-hidden bg-black/20">
						<img src={skin.file} alt={skin.name} class="h-full w-full object-cover" loading="lazy" />
					</div>
					<div class="flex flex-1 flex-col gap-1 p-3">
						<span class="font-display text-sm font-bold text-foreground">{skin.name}</span>
						<div class="mt-auto flex items-center justify-between">
							<span class="text-xs text-muted-foreground">{skin.price.toLocaleString()} XP</span>
							{#if skin.owned}
								<span class="text-[11px] font-semibold" style="color: hsl(var(--accent-green))">Owned</span>
							{/if}
						</div>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

{#if selected}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in"
		onclick={() => (selected = null)}
	>
		<div
			class="w-full max-w-sm animate-slide-up overflow-hidden border-2 bg-popover p-4"
			style="border-top-color: var(--bevel-light); border-left-color: var(--bevel-light); border-bottom-color: var(--bevel-dark); border-right-color: var(--bevel-dark); box-shadow: var(--hard-shadow); border-radius: 5px;"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="mb-3 aspect-video w-full overflow-hidden rounded" style="box-shadow: var(--inset-shadow);">
				<img src={selected.file} alt={selected.name} class="h-full w-full object-cover" />
			</div>
			<h3 class="font-display text-base font-bold text-foreground">{selected.name}</h3>
			<p class="mt-1 text-sm text-muted-foreground">{selected.price.toLocaleString()} XP</p>
			{#if purchaseError}
				<p class="mt-2 text-xs" style="color: hsl(var(--destructive));">{purchaseError}</p>
			{/if}
			<div class="mt-4 flex gap-2">
				{#if selected.owned}
					<button class="flex-1 bg-primary py-2 text-sm font-semibold text-primary-foreground" disabled>
						Equip
					</button>
				{:else}
					<button
						class="flex-1 bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-40"
						disabled={purchasing || balance < selected.price}
						onclick={() => selected && purchase(selected)}
					>
						{purchasing ? 'Purchasing…' : balance < selected.price ? 'Not enough XP' : 'Purchase'}
					</button>
				{/if}
				<button
					class="px-4 py-2 text-sm text-muted-foreground"
					style="background: hsl(var(--input)); box-shadow: var(--inset-shadow); border-radius: 5px;"
					onclick={() => (selected = null)}
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}

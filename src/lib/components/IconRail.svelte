<script lang="ts">
	import { activeNav, unread, theme, type NavId } from '$lib/stores/app';

	const logo = $derived($theme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg');

	type Item = {
		id: NavId;
		label: string;
		badge?: number;
		icon: string; // inline path data keeps this dependency-free
	};

	const primary: Item[] = [
		{ id: 'home', label: 'Home', icon: 'M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9' },
		{
			id: 'search',
			label: 'Search',
			icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.3-4.3'
		},
		{
			id: 'scrollables',
			label: 'Scrollables',
			icon: 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM10 9l5 3-5 3V9Z'
		},
		{
			id: 'notifications',
			label: 'Notifications',
			icon: 'M12 3a6 6 0 0 0-6 6v3.6L4 17h16l-2-4.4V9a6 6 0 0 0-6-6ZM9.5 20a2.5 2.5 0 0 0 5 0'
		},
		{
			id: 'messages',
			label: 'Messages',
			icon: 'M4 5h16v11H8l-4 4V5Z'
		},
		{
			id: 'achievements',
			label: 'Achievements',
			icon: 'M8 4h8v4a4 4 0 0 1-8 0V4ZM6 4H4v2a4 4 0 0 0 4 4M18 4h2v2a4 4 0 0 1-4 4M10 14h4v3h-4zM8 20h8'
		},
		{
			id: 'shop',
			label: 'Shop',
			icon: 'M4 7h16l-1.5 12h-13L4 7ZM8 7a4 4 0 0 1 8 0'
		},
		{
			id: 'profile',
			label: 'Profile',
			icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20c1.6-3.6 4.8-5.5 8-5.5s6.4 1.9 8 5.5'
		}
	];

	function badgeFor(id: NavId): number {
		if (id === 'messages') return $unread.messages;
		if (id === 'notifications') return $unread.notifications;
		return 0;
	}
</script>

<nav
	class="flex h-full w-rail flex-col items-center gap-1.5 border-r-2 py-3"
	style="border-right-color: var(--bevel-dark); background: var(--header-bg);"
>
	<button
		class="mb-2 grid h-10 w-10 place-items-center rail-icon"
		title="Lyntr"
		on:click={() => ($activeNav = 'home')}
	>
		<img src={logo} alt="Lyntr" class="h-5 w-auto" draggable="false" />
	</button>

	<div class="h-px w-8 bg-border" />

	<div class="flex flex-1 flex-col items-center gap-1.5 pt-2">
		{#each primary as item (item.id)}
			{@const active = $activeNav === item.id}
			{@const badge = badgeFor(item.id)}
			<button
				class="group relative grid h-11 w-11 place-items-center rail-icon
					{active ? 'active' : 'text-muted-foreground'}"
				title={item.label}
				on:click={() => ($activeNav = item.id)}
			>
				{#if active}
					<span
						class="absolute -left-3 h-5 w-1 rounded-r-full bg-foreground"
						aria-hidden="true"
					/>
				{/if}
				<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"
					stroke-linecap="round" stroke-linejoin="round">
					<path d={item.icon} />
				</svg>
				{#if badge > 0}
					<span
						class="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 animate-badge-pop place-items-center
							rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground"
					>
						{badge > 99 ? '99+' : badge}
					</span>
				{/if}

				<span
					class="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border-2 px-2 py-1
						text-xs font-medium text-popover-foreground opacity-0 transition-opacity duration-100 group-hover:opacity-100"
					style="background: hsl(var(--popover)); border-top-color: var(--bevel-light); border-left-color: var(--bevel-light); border-bottom-color: var(--bevel-dark); border-right-color: var(--bevel-dark); box-shadow: var(--hard-shadow);"
				>
					{item.label}
				</span>
			</button>
		{/each}
	</div>

	<div class="h-px w-8 bg-border" />

	<button
		class="rail-icon grid h-11 w-11 place-items-center {$activeNav === 'settings'
			? 'active'
			: 'text-muted-foreground'}"
		title="Settings"
		on:click={() => ($activeNav = 'settings')}
	>
		<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8"
			stroke-linecap="round" stroke-linejoin="round">
			<path
				d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5.66 8.5a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10a1.7 1.7 0 0 0 1.04-1.56V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V8a1.7 1.7 0 0 0 1.56 1.04H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.56 1.04Z"
			/>
		</svg>
	</button>
</nav>

<script lang="ts">
	import { theme, toggleTheme } from '$lib/stores/app';
	import { logout } from '$lib/auth';
	import { currentUser } from '$lib/stores/session';

	let loggingOut = $state(false);
	async function handleLogout() {
		loggingOut = true;
		await logout();
	}

	let launchOnStartup = $state(false);
	let minimizeToTray = $state(true);
	let closeToTray = $state(true);
	let desktopNotifications = $state(true);
	let notifyMessages = $state(true);
	let notifyMentions = $state(true);
	let notifyFollows = $state(false);
	let reducedMotion = $state(false);
</script>

<div class="mx-auto max-w-2xl space-y-8 p-6">
	<h1 class="font-display text-lg font-bold text-foreground">Desktop settings</h1>
	<p class="-mt-4 text-sm text-muted-foreground">
		These are separate from your Lyntr account settings and only affect this device.
	</p>

	<section class="lynt-card space-y-3 p-4">
		<h2 class="font-display text-sm font-bold text-foreground">Appearance</h2>
		<button
			class="shit flex items-center gap-2 !rounded-[5px] !px-3 !py-1.5 text-sm"
			onclick={toggleTheme}
		>
			<img src={$theme === 'dark' ? '/moon.png' : '/sun.png'} alt="" class="h-4 w-4" />
			{$theme === 'dark' ? 'Dark mode' : 'Light mode'} — click to switch
		</button>
		<label class="flex items-center justify-between py-1.5 text-sm">
			<span>Reduce motion</span>
			<input type="checkbox" bind:checked={reducedMotion} class="h-4 w-4 accent-primary" />
		</label>
	</section>

	<section class="lynt-card space-y-3 p-4">
		<h2 class="font-display text-sm font-bold text-foreground">Startup &amp; behavior</h2>
		<label class="flex items-center justify-between py-1.5 text-sm">
			<span>Launch Lyntr on startup</span>
			<input type="checkbox" bind:checked={launchOnStartup} class="h-4 w-4 accent-primary" />
		</label>
		<label class="flex items-center justify-between py-1.5 text-sm">
			<span>Minimize to tray</span>
			<input type="checkbox" bind:checked={minimizeToTray} class="h-4 w-4 accent-primary" />
		</label>
		<label class="flex items-center justify-between py-1.5 text-sm">
			<span>Close button minimizes to tray instead of quitting</span>
			<input type="checkbox" bind:checked={closeToTray} class="h-4 w-4 accent-primary" />
		</label>
	</section>

	<section class="lynt-card space-y-3 p-4">
		<h2 class="font-display text-sm font-bold text-foreground">Notifications</h2>
		<label class="flex items-center justify-between py-1.5 text-sm">
			<span>Enable desktop notifications</span>
			<input type="checkbox" bind:checked={desktopNotifications} class="h-4 w-4 accent-primary" />
		</label>
		<label class="flex items-center justify-between py-1.5 pl-4 text-sm text-muted-foreground">
			<span>Messages</span>
			<input type="checkbox" bind:checked={notifyMessages} class="h-4 w-4 accent-primary" />
		</label>
		<label class="flex items-center justify-between py-1.5 pl-4 text-sm text-muted-foreground">
			<span>Mentions &amp; replies</span>
			<input type="checkbox" bind:checked={notifyMentions} class="h-4 w-4 accent-primary" />
		</label>
		<label class="flex items-center justify-between py-1.5 pl-4 text-sm text-muted-foreground">
			<span>New followers</span>
			<input type="checkbox" bind:checked={notifyFollows} class="h-4 w-4 accent-primary" />
		</label>
	</section>

	<section class="lynt-card space-y-3 p-4">
		<h2 class="font-display text-sm font-bold text-foreground">Account</h2>
		{#if $currentUser}
			<p class="text-sm text-muted-foreground">Signed in as <b class="text-foreground">@{$currentUser.handle}</b></p>
		{/if}
		<button
			class="px-3 py-1.5 text-sm font-semibold text-destructive-foreground"
			style="background: hsl(var(--destructive)); border-radius: 5px;"
			onclick={handleLogout}
			disabled={loggingOut}
		>
			{loggingOut ? 'Signing out…' : 'Sign out'}
		</button>
	</section>
</div>

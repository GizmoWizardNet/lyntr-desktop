<script lang="ts">
	import { startLogin } from '$lib/auth';
	import { theme } from '$lib/stores/app';
	import { desktopAuthError, desktopAuthState } from '$lib/stores/desktopAuth';

	const logo = $derived($theme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg');

	const loading = $derived($desktopAuthState === 'waiting' || $desktopAuthState === 'exchanging');
	const buttonLabel = $derived(
		$desktopAuthState === 'waiting'
			? 'Waiting for sign-in…'
			: $desktopAuthState === 'exchanging'
				? 'Finishing up…'
				: 'Sign in with Discord or Google'
	);

	async function handleLogin() {
		await startLogin();
	}
</script>

<div class="flex h-full flex-col items-center justify-center gap-6 p-6">
	<div class="flex max-w-sm flex-col items-center text-center">
		<img src={logo} alt="Lyntr" class="h-[88px] w-auto object-contain" />

		<h1 class="font-display mt-4 text-[34px] font-bold leading-none text-foreground">Lyntr.</h1>
		<p class="mt-2.5 text-sm text-muted-foreground">The social media with an IQ test.</p>

		{#if $desktopAuthError}
			<p class="mt-3 text-xs" style="color: hsl(var(--destructive));">{$desktopAuthError}</p>
		{/if}

		<button
			class="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"
			onclick={handleLogin}
			disabled={loading}
		>
			{buttonLabel}
		</button>

		<p class="mt-3 text-xs text-muted-foreground">
			Opens your browser to sign in — then hop back here.
		</p>

		<div class="lynt-card mt-6 w-full p-3">
			<p class="text-xs text-muted-foreground">A project by <span class="font-bold text-foreground">GizmoWizard</span>.</p>
		</div>
	</div>
</div>

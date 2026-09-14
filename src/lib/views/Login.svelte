<script lang="ts">
	import { startLogin } from '$lib/auth';
	import { theme } from '$lib/stores/app';

	let loading = $state(false);
	const logo = $derived($theme === 'dark' ? '/logo_dark.svg' : '/logo_light.svg');

	async function handleLogin() {
		loading = true;
		try {
			await startLogin();
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex h-full flex-col items-center justify-center gap-6 p-6">
	<img src={logo} alt="Lyntr" class="h-10 w-auto" />
	<div class="lynt-card flex max-w-sm flex-col items-center gap-4 p-6 text-center">
		<h1 class="font-display text-base font-bold text-foreground">Sign in to Lyntr</h1>
		<p class="text-sm text-muted-foreground">
			Log in or sign up to continue.
		</p>
		<button
			class="w-full bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
			onclick={handleLogin}
			disabled={loading}
		>
			{loading ? 'Waiting for sign-in…' : 'Sign in'}
		</button>
	</div>
</div>

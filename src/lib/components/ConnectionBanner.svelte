<script lang="ts">
	import { connectionState } from '$lib/stores/app';
	import { authState } from '$lib/stores/session';
</script>

{#if $authState === 'authenticated' && $connectionState !== 'connected'}
	<div
		class="flex items-center justify-center gap-3 border-b-2 px-4 py-2 text-sm animate-fade-in"
		style="background: var(--header-bg); border-bottom-color: var(--bevel-dark);"
	>
		<span
			class="h-2 w-2 rounded-full {$connectionState === 'reconnecting'
				? 'animate-pulse bg-yellow-500'
				: 'bg-destructive'}"
		></span>
		<span class="text-muted-foreground">
			{#if $connectionState === 'reconnecting'}
				Connection lost. Lyntr will reconnect automatically.
			{:else}
				You're offline.
			{/if}
		</span>
		{#if $connectionState === 'offline'}
			<button
				class="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:opacity-90"
				onclick={() => connectionState.set('reconnecting')}
			>
				Retry
			</button>
		{/if}
	</div>
{/if}

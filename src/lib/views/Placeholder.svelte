<script lang="ts">
	let { section }: { section: string } = $props();
	const label = section[0].toUpperCase() + section.slice(1);
</script>

<div class="flex h-full flex-col items-center justify-center gap-2 text-center">
	<h1 class="font-display text-lg font-bold text-foreground">{label}</h1>
	<p class="max-w-sm text-sm text-muted-foreground">
		This section reuses the same API/WebSocket client as the web app — wire it up here once the
		shared client package is extracted.
	</p>
</div>

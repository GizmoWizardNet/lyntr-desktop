<script lang="ts">
	type Clip = { id: string; author: string; caption: string; likes: number; comments: number; bg: string };

	const clips: Clip[] = [
		{ id: 's1', author: 'GizmoWizard', caption: 'desktop client demo 👀', likes: 340, comments: 22, bg: 'hsl(262 40% 30%)' },
		{ id: 's2', author: 'Stormzady', caption: 'aura farming montage', likes: 812, comments: 51, bg: 'hsl(200 40% 28%)' },
		{ id: 's3', author: 'NotHMRC', caption: 'IQ test fail compilation', likes: 1204, comments: 88, bg: 'hsl(20 45% 32%)' }
	];

	let index = $state(0);
	let muted = $state(true);

	function next() {
		index = Math.min(index + 1, clips.length - 1);
	}
	function prev() {
		index = Math.max(index - 1, 0);
	}
</script>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'ArrowDown' || e.key === 'j') next();
		if (e.key === 'ArrowUp' || e.key === 'k') prev();
		if (e.key === 'm') muted = !muted;
	}}
/>

<div class="flex h-full items-center justify-center gap-3 p-6">
	<div
		class="relative flex h-full max-h-[720px] w-full max-w-[380px] flex-col justify-end overflow-hidden rounded-lg text-white"
		style="background: {clips[index].bg}; box-shadow: var(--hard-shadow);"
	>
		<div class="absolute right-3 top-3 flex flex-col gap-2">
			<button
				class="grid h-8 w-8 place-items-center rounded-full bg-black/40 text-sm"
				onclick={() => (muted = !muted)}
				title={muted ? 'Unmute' : 'Mute'}
			>
				{muted ? '🔇' : '🔊'}
			</button>
		</div>

		<div class="absolute right-3 bottom-24 flex flex-col items-center gap-4 text-sm">
			<button class="flex flex-col items-center gap-1">
				<span class="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-lg">♥</span>
				{clips[index].likes}
			</button>
			<button class="flex flex-col items-center gap-1">
				<span class="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-lg">💬</span>
				{clips[index].comments}
			</button>
			<button class="flex flex-col items-center gap-1">
				<span class="grid h-10 w-10 place-items-center rounded-full bg-black/40 text-lg">↗</span>
				Share
			</button>
		</div>

		<div class="bg-gradient-to-t from-black/70 to-transparent p-4 pt-16">
			<p class="text-sm font-semibold">@{clips[index].author}</p>
			<p class="text-sm">{clips[index].caption}</p>
		</div>
	</div>

	<div class="flex flex-col gap-2">
		<button
			class="grid h-9 w-9 place-items-center text-muted-foreground disabled:opacity-30"
			style="background: hsl(var(--input)); box-shadow: var(--inset-shadow); border-radius: 5px;"
			onclick={prev}
			disabled={index === 0}
			title="Previous (K)"
		>
			↑
		</button>
		<button
			class="grid h-9 w-9 place-items-center text-muted-foreground disabled:opacity-30"
			style="background: hsl(var(--input)); box-shadow: var(--inset-shadow); border-radius: 5px;"
			onclick={next}
			disabled={index === clips.length - 1}
			title="Next (J)"
		>
			↓
		</button>
	</div>
</div>

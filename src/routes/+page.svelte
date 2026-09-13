<script lang="ts">
	import { activeNav } from '$lib/stores/app';
	import Home from '$lib/views/Home.svelte';
	import Messages from '$lib/views/Messages.svelte';
	import Notifications from '$lib/views/Notifications.svelte';
	import Settings from '$lib/views/Settings.svelte';
	import Achievements from '$lib/views/Achievements.svelte';
	import Shop from '$lib/views/Shop.svelte';
	import Profile from '$lib/views/Profile.svelte';
	import Leaderboard from '$lib/views/Leaderboard.svelte';
	import Forum from '$lib/views/Forum.svelte';
	import Scrollables from '$lib/views/Scrollables.svelte';
	import Placeholder from '$lib/views/Placeholder.svelte';
</script>

{#if $activeNav === 'home'}
	<Home />
{:else if $activeNav === 'messages'}
	<Messages />
{:else if $activeNav === 'notifications'}
	<Notifications />
{:else if $activeNav === 'settings'}
	<Settings />
{:else if $activeNav === 'achievements'}
	<Achievements />
{:else if $activeNav === 'shop'}
	<Shop />
{:else if $activeNav === 'profile'}
	<Profile />
{:else if $activeNav === 'leaderboard'}
	<Leaderboard />
{:else if $activeNav === 'forum'}
	<Forum />
{:else if $activeNav === 'scrollables'}
	<Scrollables />
{:else}
	<Placeholder section={$activeNav} />
{/if}

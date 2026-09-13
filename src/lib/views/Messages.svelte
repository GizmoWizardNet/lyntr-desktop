<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getDmConversations,
		getDmMessages,
		sendDmMessage,
		dmDisplayName,
		type DmConversation,
		type DmMessage
	} from '$lib/api/client';
	import { avatarUrl } from '$lib/api/config';
	import { onWsEvent } from '$lib/api/ws';
	import { currentUser } from '$lib/stores/session';
	import { unread } from '$lib/stores/app';

	let conversations = $state<DmConversation[]>([]);
	let activeId = $state<string | null>(null);
	let messages = $state<DmMessage[]>([]);
	let loadingConversations = $state(true);
	let loadingMessages = $state(false);
	let error = $state<string | null>(null);
	let draft = $state('');
	let sending = $state(false);

	const active = $derived(conversations.find((c) => c.id === activeId) ?? null);

	function avatarFor(c: DmConversation): string | null {
		if (c.is_group) return c.icon_url;
		return c.other_user ? avatarUrl(c.other_user.user_id) : null;
	}

	async function loadConversations() {
		loadingConversations = true;
		error = null;
		try {
			conversations = await getDmConversations();
			if (!activeId && conversations.length > 0) activeId = conversations[0].id;
			unread.update((u) => ({
				...u,
				messages: conversations.reduce((sum, c) => sum + c.unread, 0)
			}));
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load conversations.';
		} finally {
			loadingConversations = false;
		}
	}

	async function loadMessages(conversationId: string) {
		loadingMessages = true;
		try {
			messages = await getDmMessages(conversationId);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load messages.';
		} finally {
			loadingMessages = false;
		}
	}

	onMount(() => {
		loadConversations();
		return onWsEvent((event) => {
			if (event.type === 'dm_message' && event.conversation_id === activeId) {
				loadMessages(activeId);
			} else if (event.type === 'dm_message') {
				loadConversations();
			}
		});
	});

	$effect(() => {
		if (activeId) loadMessages(activeId);
	});

	async function submit() {
		if (!draft.trim() || !activeId || sending) return;
		sending = true;
		const content = draft.trim();
		draft = '';
		try {
			const sent = await sendDmMessage(activeId, content);
			messages = [...messages, sent];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send.';
			draft = content;
		} finally {
			sending = false;
		}
	}
</script>

<div class="grid h-full grid-cols-[300px_minmax(0,1fr)]">
	<div class="flex flex-col border-r border-border">
		<div class="border-b border-border p-3">
			<input
				type="text"
				placeholder="Search conversations…"
				class="w-full px-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
			/>
		</div>
		{#if loadingConversations}
			<p class="p-3 text-xs text-muted-foreground">Loading…</p>
		{:else if conversations.length === 0}
			<p class="p-3 text-xs text-muted-foreground">No conversations yet.</p>
		{:else}
			<ul class="flex-1 overflow-y-auto">
				{#each conversations as c (c.id)}
					<li>
						<button
							class="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-accent
								{activeId === c.id ? 'bg-accent' : ''}"
							onclick={() => (activeId = c.id)}
						>
							{#if avatarFor(c)}
								<img src={avatarFor(c)} alt="" class="h-10 w-10 shrink-0 rounded-full object-cover" />
							{:else}
								<div class="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-semibold">
									{dmDisplayName(c)[0]?.toUpperCase()}
								</div>
							{/if}
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between">
									<span class="truncate text-sm font-medium text-foreground">{dmDisplayName(c)}</span>
								</div>
								{#if c.last_message_preview}
									<span class="block truncate text-xs text-muted-foreground">{c.last_message_preview}</span>
								{/if}
							</div>
							{#if c.unread > 0}
								<span class="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
									{c.unread}
								</span>
							{/if}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<div class="flex flex-col">
		{#if error}
			<div class="p-4 text-sm" style="color: hsl(var(--destructive));">{error}</div>
		{/if}

		{#if active}
			<div class="flex items-center gap-3 border-b border-border px-4 py-3">
				{#if avatarFor(active)}
					<img src={avatarFor(active)} alt="" class="h-9 w-9 rounded-full object-cover" />
				{:else}
					<div class="grid h-9 w-9 place-items-center rounded-full bg-secondary font-semibold">
						{dmDisplayName(active)[0]?.toUpperCase()}
					</div>
				{/if}
				<span class="font-medium text-foreground">{dmDisplayName(active)}</span>
			</div>

			<div class="flex-1 space-y-3 overflow-y-auto p-4">
				{#if loadingMessages}
					<p class="text-center text-xs text-muted-foreground">Loading…</p>
				{:else}
					{#each messages as m (m.id)}
						<div class="flex {m.sender_id === $currentUser?.id ? 'justify-end' : 'justify-start'}">
							<div
								class="max-w-[70%] rounded-2xl px-3.5 py-2 text-sm
									{m.sender_id === $currentUser?.id
									? 'rounded-br-sm bg-primary text-primary-foreground'
									: 'rounded-bl-sm bg-secondary text-foreground'}"
							>
								{m.content}
								<div class="mt-1 text-[10px] opacity-60">
									{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<div class="flex items-center gap-2 border-t border-border p-3">
				<input
					type="text"
					bind:value={draft}
					onkeydown={(e) => e.key === 'Enter' && submit()}
					placeholder="Type a message…"
					class="flex-1 !rounded-full px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none"
				/>
				<button
					class="grid h-9 w-9 place-items-center !rounded-full bg-primary text-primary-foreground disabled:opacity-50"
					disabled={!draft.trim() || sending}
					onclick={submit}
				>
					<svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M3 20l18-8L3 4v6l12 2-12 2z" /></svg>
				</button>
			</div>
		{:else if !loadingConversations}
			<div class="flex h-full items-center justify-center text-sm text-muted-foreground">
				Select a conversation.
			</div>
		{/if}
	</div>
</div>
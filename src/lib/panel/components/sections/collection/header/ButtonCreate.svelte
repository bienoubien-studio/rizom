<script lang="ts">
	import { CirclePlus, SquarePlus } from '@lucide/svelte';
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { getContext } from 'svelte';
	import { type CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import { t__ } from '$lib/core/i18n/index.js';

	type ButtonSize = 'sm' | 'default';
	const { size = 'default' }: { size?: ButtonSize } = $props();
	const collection = getContext<CollectionContext>('rizom.collectionList');

	const isSmallSize = $derived(size === 'sm');
	const buttonVariant = $derived(isSmallSize ? 'ghost' : 'default');
	const buttonSize = $derived(isSmallSize ? 'icon-sm' : 'default');
	const buttonLabel = $derived(
		t__(`common.create_new|${collection.config.label.gender}`, collection.config.label.singular)
	);
</script>

{#if collection.canCreate}
	<Button variant={buttonVariant} size={buttonSize} href="/panel/{collection.config.slug}/create">
		{#if isSmallSize}
			<CirclePlus size={16} />
		{:else}
			{buttonLabel}
		{/if}
	</Button>
{/if}

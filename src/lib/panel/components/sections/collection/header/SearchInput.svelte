<script lang="ts">
	import { getContext } from 'svelte';
	import type { CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import { Search } from '@lucide/svelte';
	import Input from '$lib/panel/components/ui/input/input.svelte';
	import { t__ } from '$lib/core/i18n/index.js';

	const collection = getContext<CollectionContext>('rizom.collectionList');
	let filterValue = $state('');

	$effect(() => {
		collection.filterBy(filterValue);
	});
</script>

<div class="rz-header-search-input">
	<div class="rz-header-search-input__icon">
		<Search size={16} />
	</div>
	<Input
		class="rz-header-search-input__input"
		placeholder={t__('common.search', `${collection.length} document(s)`)}
		type="text"
		bind:value={filterValue}
	/>
</div>

<style type="postcss">
	.rz-header-search-input {
		position: relative;
		display: none;
		height: var(--rz-size-11);
		align-items: center;
		width: var(--rz-size-80);

		& :global(.rz-input) {
			height: var(--rz-size-9);
			width: 100%;
			padding-left: var(--rz-size-12);
			font-size: var(--rz-text-sm);
			&:focus-visible {
				@mixin ring var(--rz-color-ring);
			}
		}
	}

	@container (min-width: 720px) {
		.rz-header-search-input {
			display: flex;
		}
	}

	.rz-header-search-input__icon {
		position: absolute;
		left: var(--rz-size-3);
	}
</style>

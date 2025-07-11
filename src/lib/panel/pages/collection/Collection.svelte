<script lang="ts">
	import { setCollectionContext } from '$lib/panel/context/collection.svelte.js';
	import { getContext, setContext } from 'svelte';
	import Unauthorized from '$lib/panel/components/sections/unauthorized/Unauthorized.svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import Page from '$lib/panel/components/sections/page-layout/Page.svelte';
	import PageHeader from '$lib/panel/components/ui/page-header/PageHeader.svelte';
	import LanguageSwitcher from '$lib/panel/components/ui/language-switcher/LanguageSwitcher.svelte';
	import { invalidateAll } from '$app/navigation';
	import CollectionTree from '$lib/panel/components/sections/collection/tree/CollectionTree.svelte';
	import CollectionHeader from '$lib/panel/components/sections/collection/header/Header.svelte';
	import SearchInput from '$lib/panel/components/sections/collection/header/SearchInput.svelte';
	import ButtonCreate from '$lib/panel/components/sections/collection/header/ButtonCreate.svelte';
	import type { GenericDoc, PrototypeSlug } from '$lib/core/types/doc';
	import CollectionGrid from '$lib/panel/components/sections/collection/grid/CollectionGrid.svelte';
	import type { Directory } from '$lib/core/collections/upload/upload.js';
	import CollectionList from '$lib/panel/components/sections/collection/list/CollectionList.svelte';
	
	type Props = {
		slug: PrototypeSlug;
		data: {
			status: number;
			docs: GenericDoc[];
			canCreate: boolean;
			upload?: {
				directories: Directory[];
				currentPath: `root${string}`;
				parentDirectory: Directory;
			};
		};
	};

	const { data, slug }: Props = $props();
	const config = getConfigContext();
	const collectionConfig = config.getCollection(slug);
	
	const collection = setCollectionContext({
		initial: data.docs,
		config: collectionConfig,
		canCreate: data.canCreate,
		upload: data.upload,
		key: slug
	});

	setContext('rizom.collectionList', collection);

	$effect(() => {
		collection.upload = {
			directories: data.upload?.directories || [],
			currentPath: data.upload?.currentPath || 'root',
			parentDirectory: data.upload?.parentDirectory || null
		};
	});

	$effect(() => {
		collection.docs = data.docs
	})

	const titleContext = getContext<{ value: string }>('title');
	titleContext.value = collection.config.label.plural;
</script>

{#if data.status === 200}
	<Page>
		{#snippet main()}
			<PageHeader>
				{#snippet title()}
					{collection.title}
				{/snippet}

				{#snippet bottomLeft()}
					<ButtonCreate size="sm" />
					<CollectionHeader />
				{/snippet}

				{#snippet topRight()}
					{#each config.raw.panel.components.collectionHeader as CustomHeaderComponent, index (index)}
						<CustomHeaderComponent />
					{/each}
					
					<LanguageSwitcher onLocalClick={() => invalidateAll()} />
					
				{/snippet}

				{#snippet bottomRight()}
					<SearchInput />
				{/snippet}
			</PageHeader>

			<div class="rz-collection__docs">
				{#if collection.isNested()}
					<CollectionTree {collection} />
				{:else if collection.isGrid()}
					<CollectionGrid {collection} />
				{:else}
					<CollectionList {collection} />
				{/if}
			</div>
		{/snippet}
	</Page>
{:else}
	<Unauthorized />
{/if}

<style type="postcss">
	.rz-collection__docs {
		container: collection-area / inline-size;
		width: 100%;
		text-align: left;
		padding: var(--rz-size-6) var(--rz-page-gutter);
		& :global(.rz-scroll-area) {
			height: calc(100vh - 7.5rem);
			width: 100%;
		}
		& :global(.rz-scroll-area--grid) {
			height: calc(100vh - 3.5rem);
			background-color: hsl(var(--rz-gray-10));
		}
		& :global(.rz-scroll-area--nested) {
			height: calc(100vh - 3.5rem);
			background-color: hsl(var(--rz-gray-10));
		}
	}
</style>

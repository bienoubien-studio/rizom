<script lang="ts">
	import { type CollectionContext } from 'rizom/panel/context/collection.svelte';
	import Checkbox from '$lib/panel/components/ui/checkbox/checkbox.svelte';
	import { getPanelThumbnailKey, isUploadConfig } from '$lib/config/utils.js';
	import UploadThumbCell from '../upload-thumb-cell/UploadThumbCell.svelte';
	import { getLocaleContext } from 'rizom/panel/context/locale.svelte';
	import { getContext } from 'svelte';
	import type { GenericDoc, FieldsType } from 'rizom/types';
	import { getConfigContext } from 'rizom/panel/context/config.svelte';

	type Props = {
		checked: boolean;
		doc: GenericDoc;
		active: boolean;
		compact: boolean;
	};

	const { checked, doc, active, compact }: Props = $props();
	const collection = getContext<CollectionContext>('collectionList');
	const locale = getLocaleContext();
	const config = getConfigContext();

	const getCellComponent = (fieldType: FieldsType) => {
		return config.raw.blueprints[fieldType].cell || null;
	};

	let gridTemplateColumn = $state('grid-template-columns: repeat(1, minmax(0, 1fr));');

	$effect(() => {
		const columnLength = collection.columns.length + 2;
		gridTemplateColumn = `grid-template-columns: repeat(${compact ? 1 : columnLength}, minmax(0, 1fr));`;
	});

	const formattedDate = $derived(doc.updatedAt ? locale.dateFormat(doc.updatedAt, true) : '');
</script>

<div style={gridTemplateColumn} class="rz-list-row" class:rz-list-row--active={active}>
	<div class="rz-list-row__main">
		{#if collection.selectMode}
			<Checkbox {checked} onclick={() => collection.toggleSelectOf(doc.id)} />
			{#if isUploadConfig(collection.config)}
				<UploadThumbCell url={doc[getPanelThumbnailKey(collection.config)]} />
			{/if}
			<span class="rz-list-row__title">{doc.title || '[undefined]'}</span>
		{:else}
			<a class="rz-list-row__link" href="/panel/{collection.config.slug}/{doc.id}">
				{#if isUploadConfig(collection.config)}
					<UploadThumbCell url={doc[getPanelThumbnailKey(collection.config)]} />
				{/if}
				<span class="rz-list-row__title">{doc.title || '[undefined]'}</span>
			</a>
		{/if}
	</div>

	{#if !compact}
		{#each collection.columns as column}
			<div class="rz-list-row__cell">
				{#if column.table?.cell}
					{@const ColumnTableCell = column.table.cell}
					<ColumnTableCell value={doc[column.name]} />
				{:else if getCellComponent(column.type)}
					{@const Cell = getCellComponent(column.type)}
					<Cell value={doc[column.name]} />
				{:else}
					{doc[column.name]}
				{/if}
			</div>
		{/each}
		<div class="rz-list-row__cell">
			{formattedDate}
		</div>
	{/if}
</div>

<style type="postcss" global>
	.rz-list-row {
		display: grid;
		height: var(--rz-size-16);
		align-items: center;
		border-bottom: 1px solid hsl(var(--rz-ground-4) / 1);
		font-size: var(--rz-text-sm);
		@mixin font-normal;
	}

	.rz-list-row--active {
		background-color: hsl(var(--rz-ground-5));
	}

	.rz-list-row__main {
		display: flex;
		align-items: center;
		gap: var(--rz-size-3);
		padding-left: var(--rz-size-6);
		padding-right: var(--rz-size-6);
	}

	.rz-list-row__link {
		display: flex;
		align-items: center;
		gap: var(--rz-size-2);
		@mixin font-medium;
	}

	.rz-list-row__title {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-all;
		@mixin font-semibold;
	}

	.rz-list-row__cell {
		@mixin color foreground, 0.6;
	}
</style>

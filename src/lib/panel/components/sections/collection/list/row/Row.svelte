<script lang="ts">
	import Checkbox from '$lib/panel/components/ui/checkbox/checkbox.svelte';
	import { isUploadConfig } from '$lib/util/config.js';
	import UploadThumbCell from '../../upload-thumb-cell/UploadThumbCell.svelte';
	import { getLocaleContext } from '$lib/panel/context/locale.svelte';
	import { getContext } from 'svelte';
	import { getConfigContext } from '$lib/panel/context/config.svelte';
	import { getValueAtPath } from '$lib/util/object';
	import type { CollectionContext } from '$lib/panel/context/collection.svelte.js';
	import type { GenericDoc } from '$lib/core/types/doc.js';
	import StatusDot from '../../StatusDot.svelte';

	type Props = {
		checked: boolean;
		doc: GenericDoc;
	};

	const { checked, doc }: Props = $props();
	const collection = getContext<CollectionContext>('rizom.collectionList');

	const locale = getLocaleContext();
	const config = getConfigContext();

	const getCellComponent = (fieldType: string) => {
		return config.raw.blueprints[fieldType].cell || null;
	};

	let gridTemplateColumn = $state('grid-template-columns: 2fr repeat(1, minmax(0, 1fr));');

	$effect(() => {
		const columnLength = collection.columns.length + 2;
		gridTemplateColumn = `grid-template-columns: 2fr repeat(${columnLength - 1}, minmax(0, 1fr));`;
	});

	const formattedDate = $derived(doc.updatedAt ? locale.dateFormat(doc.updatedAt, { short: true }) : '');
</script>

<div style={gridTemplateColumn} class="rz-list-row">
	<div class="rz-list-row__main">
		
		{#if collection.selectMode}
			<Checkbox id="checkbox-{doc.id}" class="rz-list-row__checkbox" {checked} onCheckedChange={() => collection.toggleSelectOf(doc.id)} />
			{#if isUploadConfig(collection.config)}
				{#key doc.filename}
					<UploadThumbCell url={doc._thumbnail} mimeType={doc.mimeType} />
				{/key}
			{/if}
			<label for="checkbox-{doc.id}" class="rz-list-row__title">{doc.title || '[untitled]'}</label>
		{:else}
			<a class="rz-list-row__link" href="/panel/{collection.config.slug}/{doc.id}">
				{#if isUploadConfig(collection.config)}
					<UploadThumbCell url={doc._thumbnail} mimeType={doc.mimeType} />
				{:else}
					{@const Icon = collection.config.icon}
					<div class="rz-list-row__icon"><Icon size="13" /></div>
				{/if}

				<span class="rz-list-row__title">{doc.title || '[untitled]'}</span>
				{#if collection.hasDraft}
					<StatusDot --rz-dot-size="0.28rem" status={doc.status} />
				{/if}
			</a>
		{/if}
	</div>

	{#each collection.columns as column, index (index)}
		<div class="rz-list-row__cell">
			{#if column.table?.cell}
				{@const ColumnTableCell = column.table.cell}
				<ColumnTableCell value={getValueAtPath(column.path, doc)} />
			{:else if getCellComponent(column.type)}
				{@const Cell = getCellComponent(column.type)}
				<Cell value={getValueAtPath(column.path, doc)} />
			{:else}
				{getValueAtPath(column.path, doc)}
			{/if}
		</div>
	{/each}

	<div class="rz-list-row__cell">
		{formattedDate}
	</div>
</div>

<style type="postcss">
	.rz-list-row {
		display: grid;
		height: var(--rz-row-height);
		align-items: center;
		border: var(--rz-border);
		border-radius: var(--rz-radius-md);
		background-color: hsl(var(--rz-row-color));
		.rz-list-row__icon {
			height: var(--rz-size-10);
			width: var(--rz-size-10);
			border-radius: var(--rz-radius-md);
			display: flex;
			align-items: center;
			justify-content: center;
			background-color: light-dark(hsl(var(--rz-gray-15)), hsl(var(--rz-gray-1)));
		}
		:global {
			.rz-list-row__checkbox {
				margin-left: var(--rz-size-2);
			}
		}
	}

	.rz-list-row__main {
		display: flex;
		align-items: center;
		gap: var(--rz-size-3);
		padding-left: var(--rz-size-1);
		padding-right: var(--rz-size-5);
	}

	.rz-list-row__link {
		display: flex;
		align-items: center;
		gap: var(--rz-size-4);
	}

	.rz-list-row__title {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
		word-break: break-all;
	}
	label.rz-list-row__title{
		cursor: pointer;
	}

	.rz-list-row__cell {
		@mixin color foreground, 0.6;
	}
</style>

<script lang="ts">
	import { GripVertical, ToyBrick } from '@lucide/svelte';
	import BlockActions from './BlockActions.svelte';
	import { capitalize } from '$lib/util/string.js';
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { useOnce } from '$lib/panel/util/once.svelte.js';
	import RenderFields from '$lib/panel/components/fields/RenderFields.svelte';
	import type { BlocksFieldRaw } from '../index.ts';
	import type { GenericBlock } from '$lib/core/types/doc.js';
	import { watch } from 'runed';

	type Props = {
		config: BlocksFieldRaw['blocks'][number];
		path: string;
		sorting: boolean;
		deleteBlock: () => void;
		duplicateBlock: () => void;
		form: DocumentFormContext;
	};

	const { config, path, deleteBlock, duplicateBlock, form, sorting = false }: Props = $props();

	let currentPath = $state.raw(path);
	let isOpen = $state(true);
	const position = $derived(parseInt(currentPath.split('.').pop() || '0'));
	const blockValue = $derived(form.getValue<GenericBlock>(path));

	const { once } = useOnce();

	once(() => {
		if (blockValue) {
			isOpen = (localStorage.getItem(`${blockValue.id}:open`) || 'true') === 'true';
		}
	});

	export const setCollapse = (bool: boolean) => {
		isOpen = !bool;
	};

	export const toggleBlock = (e: MouseEvent) => {
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
		isOpen = !isOpen;
	};

	const renderBlockTitle = () => {
		if (config.renderTitle) {
			const title = config.renderTitle({ values: blockValue || {}, position });
			if (title) return title;
		}
		const title = config.label ? config.label : capitalize(config.name);
		return title;
	};

	$effect(() => {
		if (currentPath !== path) {
			let pathArr = path.split('.');
			form.setValue(`${path}.path`, pathArr.toSpliced(pathArr.length - 1, 1).join('.'));
			currentPath = path;
		}
	});

	watch(
		() => isOpen,
		() => {
			if (blockValue) {
				localStorage.setItem(`${blockValue.id}:open`, isOpen.toString());
			}
		}
	);

	const BlockIcon = config.icon || ToyBrick;
</script>

<div data-sorting={sorting} class="rz-block">
	<div class="rz-block__content" class:rz-block__content--closed={!isOpen}>
		<header class="rz-block__header">
			<button type="button" onclick={toggleBlock} class="rz-block__title-button">
				<div class="rz-block__title">
					<div class="rz-block__icon">
						<BlockIcon size={12} />
					</div>
					<h3 class="rz-block__heading">
						{renderBlockTitle()}
					</h3>
				</div>
			</button>

			<BlockActions {duplicateBlock} {deleteBlock} />

			<div class="rz-block__grip">
				<GripVertical size={15} />
			</div>
		</header>

		<div class="rz-block__fields" class:rz-block__fields--hidden={!isOpen}>
			<RenderFields fields={config.fields} {path} {form} />
		</div>
	</div>
</div>

<style type="postcss">
	.rz-block {
		--rz-fields-padding: var(--rz-size-5);
		position: relative;
		border: var(--rz-border);
		border-radius: var(--rz-radius-sm);
	}

	.rz-block__grip {
		cursor: grab;
	}

	.rz-block:hover > :global(.rz-block__content > .rz-block__header > .rz-block-actions) {
		opacity: 1;
		pointer-events: all;
	}

	.rz-block__content {
		background-color: var(--rz-collapse-fields-content-bg);
	}

	.rz-block__header {
		display: flex;
		position: relative;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		border-bottom: var(--rz-border);
		padding-right: var(--rz-size-2);
	}

	.rz-block__title-button {
		flex: 1;
		justify-content: flex-start;
		flex-direction: row;
		padding: var(--rz-size-1);
	}

	.rz-block__content--closed {
		border-radius: var(--rz-radius-md);
		.rz-block__header {
			height: var(--rz-size-8);
			border-color: transparent;
			width: 100%;
		}

		:global(.rz-block-actions) {
			position: absolute;
			opacity: 0;
			pointer-events: none;
			top: var(--rz-size-1);
			right: var(--rz-size-11);
		}
		&:global(:has(.rz-field-error)) {
			@mixin ring var(--rz-color-alert);
		}
	}

	.rz-block__title {
		display: flex;
		height: var(--rz-size-6);
		align-items: center;
		justify-content: flex-start;
		gap: var(--rz-size-2);
		padding: var(--rz-size-1);
		font-size: var(--rz-text-xs);
	}

	.rz-block__heading {
		@mixin font-medium;
	}

	.rz-block__fields {
		flex: 1;
		padding: var(--rz-size-6) 0;
	}

	.rz-block__fields--hidden {
		display: none;
	}

	.rz-block[data-sorting='true'] .rz-block__grip {
		display: none;
	}

	:global(.rz-block-actions) {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		top: var(--rz-size-1);
		right: var(--rz-size-11);
	}
</style>

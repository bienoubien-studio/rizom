<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import { CirclePlus, Plus, ToyBrick } from '@lucide/svelte';
	import { capitalize } from '$lib/util/string.js';
	import { emptyValuesFromFieldConfig } from '$lib/util/field.js';
	import { isFormField } from '$lib/util/field.js';
	import * as Command from '$lib/panel/components/ui/command/index.js';
	import type { GenericBlock } from '$lib/core/types/doc.js';
	import type { BlocksFieldRaw, BlocksFieldBlock } from '../index.js';
	import { t__ } from '$lib/core/i18n/index.js';
	import type { WithoutBuilders } from '$lib/util/types.js';
	import { env } from '$env/dynamic/public';

	type AddBlock = (options: Omit<GenericBlock, 'id' | 'path'>) => void;
	type Props = {
		config: BlocksFieldRaw;
		addBlock: AddBlock;
	};
	const { config, addBlock }: Props = $props();

	let open = $state(false);
	let ariaSelected = $state('');

	const add = (block: WithoutBuilders<BlocksFieldBlock>) => {
		open = false;
		const empty = {
			...emptyValuesFromFieldConfig(block.fields.filter(isFormField)),
			type: block.name
		};
		addBlock(empty);
	};
</script>

{#if config.blocks.length === 1}
	<Button onclick={() => add(config.blocks[0])} variant="ghost" icon={CirclePlus} size="icon" />
{:else}
	<Button onclick={() => (open = true)} variant="ghost" icon={CirclePlus} size="icon" />

	<Command.Dialog
		onStateChange={(state) => {
			ariaSelected = state.value;
		}}
		bind:open
	>
		<Command.Input class="rz-add-block-button__search" placeholder={t__('common.search')} />

		<div class="rz-add-block-button__command-content">
			<Command.List class="rz-add-block-button__list">
				<Command.Empty>No results found.</Command.Empty>
				<Command.Group heading="Component">
					{#each config.blocks as block, index (index)}
						{@const BlockIcon = block.icon || ToyBrick}
						<Command.Item
							class="rz-add-block-button__item"
							value={block.name}
							onSelect={() => {
								add(block);
								open = false;
							}}
						>
							<div class="rz-add-block-button__icon-wrapper">
								<BlockIcon size={17} />
							</div>

							<div class="rz-add-block-button__info">
								<p class="rz-add-block-button__title">
									{block.label || capitalize(block.name)}
								</p>
								{#if block.description}
									<p class="rz-add-block-button__description">
										{block.description}
									</p>
								{/if}
							</div>
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>

			<div class="rz-add-block-button__preview-wrap">
				{#each config.blocks as block, index (index)}
					<div
						class:rz-add-block-button__preview--active={ariaSelected === block.name}
						class="rz-add-block-button__preview"
					>
						{#if block.image}
							<img src="{env.PUBLIC_RIZOM_URL}{block.image}" alt="preview" />
						{:else}
							no preview
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</Command.Dialog>
{/if}

<style type="postcss">
	:global {
		.rz-add-block-button {
			gap: var(--rz-size-2);
		}

		.rz-command-dialog-content {
			width: 60vw;
		}

		.rz-add-block-button__command-content {
			display: grid;
			position: relative;
			grid-template-columns: 3fr 2fr;
		}
		.rz-add-block-button__search {
			border-radius: var(--rz-radius-xl);
		}

		.rz-add-block-button__list {
			padding: var(--rz-size-2);
			border-right: var(--rz-border);
		}

		.rz-add-block-button__item {
			display: flex;
			gap: var(--rz-size-3);
			border-radius: var(--rz-radius-md);
		}
		
		.rz-add-block-button__preview-wrap {
			display: flex;
			align-items: center;
			justify-content: center;
			img {
				width: 200px;
				height: auto;
			}
		}
		.rz-add-block-button__preview.rz-add-block-button__preview--active {
			display: block;
		}
		.rz-add-block-button__preview {
			display: none;
		}
	}

	.rz-add-block-button__icon-wrapper {
		display: flex;
		width: var(--rz-size-12);
		height: var(--rz-size-12);
		align-items: center;
		justify-content: center;
		border-radius: var(--rz-radius-xl);
	}

	.rz-add-block-button__title {
		font-size: var(--rz-text-lg);
		@mixin font-medium;
	}

	.rz-add-block-button__description {
		color: hsl(var(--rz-color-fg) / 0.5);
		margin-top: var(--rz-size-1);
		font-size: var(--rz-text-sm);
	}
</style>

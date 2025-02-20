<script lang="ts">
	import { Switch } from '$lib/panel/components/ui/switch/index.js';
	import { Input } from '$lib/panel/components/ui/input';
	import * as DropdownMenu from '$lib/panel/components/ui/dropdown-menu';
	import { Field } from 'rizom/panel';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { capitalize } from '$lib/utils/string.js';
	import { Link2, Newspaper, Anchor, AtSign, Phone, ChevronDown, Edit } from 'lucide-svelte';
	import RessourceInput from './RessourceInput.svelte';
	import Label from 'rizom/panel/components/ui/label/label.svelte';
	import type { LinkFieldProps } from './props';
	import { t__ } from 'rizom/panel/i18n/index.js';
	import { dataError } from 'rizom/panel/utility/dataError';

	const { path, config, form }: LinkFieldProps = $props();

	const icons: Record<string, any> = {
		url: Link2,
		email: AtSign,
		tel: Phone,
		anchor: Anchor
	};

	const placeholders: Record<string, string> = {
		url: 'https://',
		email: 'emile@zola.fr',
		tel: '+330700000000',
		anchor: 'my-anchor'
	};

	const primitiveTypes = ['url', 'email', 'tel', 'anchor'];
	const field = $derived(form.useField(path, config));
	const linkTypes = config.types || ['url', 'email', 'tel', 'anchor'];
	const initial = path ? form.getRawValue(path) : null;

	let editing = $state(false);
	let initialLinkType = initial?.type || linkTypes[0];
	let initialLinkValue = initial?.link || '';
	let initialLabel = initial?.label || '';
	let initialTargetBlank = (initial?.target && initial.target === '_blank') || false;

	let inputValue = $state(initialLinkValue);
	let inputLabelValue = $state(initialLabel);
	let linkType = $state(initialLinkType);
	let linkValue = $state(initialLinkValue);
	let targetBlank = $state(initialTargetBlank);

	let isPrimitiveType = $derived(primitiveTypes.includes(linkType));
	let Icon = $derived(icons[linkType] || Newspaper);
	let placeholder = $derived(placeholders[linkType] || '');
	let ressourceId = $state(!primitiveTypes.includes(initialLinkType) ? initialLinkValue : '');
	const hasTarget = $derived(!['anchor', 'email', 'tel'].includes(linkType));

	let isLinkValueError = $state(false);
	let isLinkRequiredError = $derived(!!field.error && field.error.includes(`required::`));

	const onInput = (event: Event) => {
		linkValue = (event.target as HTMLInputElement).value;
		setValue();
	};

	const onInputLabel = (event: Event) => {
		inputLabelValue = (event.target as HTMLInputElement).value;
		setValue();
	};

	const onTypeChange = (type: string | undefined) => {
		linkType = type || 'url';
		inputValue = '';
		ressourceId = '';
		setValue();
		if (!form.errors.hasRequired(path || config.name)) {
			form.errors.delete(path || config.name);
		}
	};

	$effect(() => {
		if (!isPrimitiveType && field.value && ressourceId !== field.value.link) {
			linkValue = ressourceId;
			setValue();
		}
	});

	const onTargetChange = (value: boolean) => {
		targetBlank = value;
		setValue();
	};

	const setValue = () => {
		field.value = {
			label: inputLabelValue,
			type: linkType,
			link: linkValue,
			target: targetBlank ? '_blank' : '_self'
		};
	};

	$effect(() => {
		const linkTypeError = !!field.error && field.error.includes(`${linkType}::`);
		isLinkValueError = linkTypeError || (isLinkRequiredError && !linkValue);
	});
</script>

<Field.Root class={config.className} visible={field.visible} disabled={!field.editable}>
	<Field.Label {config} />

	{#if editing}
		<div class="rz-link-field" data-error={field.error ? 'true' : 'false'}>
			<Input
				bind:value={inputLabelValue}
				data-error={isLinkRequiredError ? '' : null}
				oninput={onInputLabel}
				placeholder="Label"
			/>

			<div
				class="rz-link-field__bottom"
				style="--rz-corner-radius:{hasTarget ? 0 : 'var(--rz-radius-md)'}"
			>
				<!-- Type -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button class="rz-link__type-button" variant="outline" {...props}>
								<Icon class="rz-link__type-icon" size={12} />
								<p class="rz-link__type-text">{capitalize(linkType)}</p>
								<ChevronDown class="rz-link__type-icon" size={12} />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>

					<DropdownMenu.Portal>
						<DropdownMenu.Content class="rz-link__type-content" align="start">
							<DropdownMenu.RadioGroup onValueChange={onTypeChange} bind:value={linkType}>
								{#each linkTypes as type}
									<DropdownMenu.RadioItem value={type}>
										{capitalize(type)}
									</DropdownMenu.RadioItem>
								{/each}
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>

				<!-- Value -->

				{#if isPrimitiveType}
					<Input
						id={path || config.name}
						name={path || config.name}
						data-error={isLinkValueError ? '' : null}
						value={inputValue}
						{placeholder}
						oninput={onInput}
					/>
				{:else}
					<RessourceInput
						error={isLinkValueError}
						type={linkType}
						bind:ressourceId
						readOnly={form.readOnly}
					/>
				{/if}

				<!-- Target -->
				{#if hasTarget}
					<div class="rz-link__target">
						<Switch checked={targetBlank} onCheckedChange={onTargetChange} id="target" />
						<Label for="target">{t__('fields.new_tab')}</Label>
					</div>
				{/if}
			</div>
		</div>

		<Button class="rz-link-field-close-edit" onclick={() => (editing = false)} size="sm"
			>close</Button
		>
	{:else}
		<button
			type="button"
			class="rz-link-field-edit"
			data-empty={field.isEmpty ? '' : null}
			use:dataError={!!field.error}
			onclick={() => (editing = true)}
		>
			{#if field.isEmpty}
				<Edit size="12" />
				{t__('common.edit_link')}
			{:else}
				<Icon size="12" />
				<span>{field.value.label}</span>
				<span>{field.value.link}</span>
			{/if}
		</button>
	{/if}

	<Field.Error error={field.error} />
</Field.Root>

<style type="postcss">
	.rz-link-field {
		:global(.rz-input) {
			border-bottom-left-radius: 0;
			border-bottom-right-radius: var(--rz-corner-radius);
		}

		:global(:focus-visible),
		:global([data-error]) {
			position: relative;
			z-index: 10;
		}
	}

	.rz-link-field__bottom {
		display: flex;
		position: relative;

		.rz-link__type-text {
			display: none;
		}

		:global(.rz-button) {
			min-width: var(--rz-size-16);
			border-top-left-radius: 0;
			border-top-right-radius: 0;
			border-bottom-right-radius: 0;
			height: var(--rz-size-11);
			border-top: none;
			border-right: none;
			justify-content: start;
			font-size: var(--rz-text-sm);

			> * {
				flex-shrink: 0;
			}

			:global(.rz-link__type-icon) {
				width: var(--rz-size-6);
			}
		}

		@container rz-field-root (min-width:640px) {
			.rz-link__type-text {
				display: block;
			}
			:global(.rz-button) {
				min-width: var(--rz-size-32);
			}
		}

		:global(.rz-input),
		:global(.rz-ressource-input) {
			border-top-left-radius: 0;
			border-bottom-left-radius: 0;
			border-top-right-radius: 0;
			border-top: none;
		}
	}

	.rz-link__target {
		background-color: hsl(var(--rz-ground-5));
		border-bottom: var(--rz-border);
		border-right: var(--rz-border);
		border-bottom-right-radius: var(--rz-radius-md);
		display: flex;
		align-items: center;
		gap: var(--rz-size-4);
		padding: 0 var(--rz-size-4);

		:global(.rz-label) {
			white-space: nowrap;
		}
	}

	/** SAVE BUTTON */

	:global(.rz-link-field-close-edit) {
		margin-top: var(--rz-size-2);
		min-width: 80px;
	}
	/** EDIT BUTTON */

	.rz-link-field-edit {
		@mixin font-medium;
		width: 100%;
		background-color: hsl(var(--rz-ground-5) / 0.6);
		border: var(--rz-border);
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: var(--rz-size-2);
		padding: 0 var(--rz-size-3);
		border-radius: var(--rz-radius-md);
		height: var(--rz-size-11);
		font-size: var(--rz-text-sm);
		&:not([data-emtpy]) {
			span:last-child {
				@mixin font-normal;
				color: hsl(var(--rz-ground-2));
			}
		}
		&:global([data-error]) {
			@mixin ring var(--rz-color-error);
		}
	}
</style>

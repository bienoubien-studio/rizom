<script lang="ts">
	import './styles/rich-text.css';
	import { onMount } from 'svelte';
	import { Editor } from '@tiptap/core';
	import EditorBubbleMenu from './bubble-menu/bubble-menu.svelte';
	import { buildEditorConfig } from '../core/config-builders.js';
	import { Field } from '$lib/panel/components/fields/index.js';
	import type { RichTextFieldProps } from './props.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import type { RichTextFeature } from '../core/types';
	import DragHandler from './drag-handle/drag-handle.svelte';
	import Suggestion from './suggestion/suggestion.svelte';
	import { setRichTextContext } from './context.svelte';

	const { path, config, form, standAlone, class: className }: RichTextFieldProps = $props();

	let element: HTMLElement;
	const key = `richtext-${path}`;

	let editor = $state<Editor>();
	let features = $state<RichTextFeature[]>([]);

	const field = $derived(form.useField(path, config));

	setRichTextContext(path);

	onMount(() => {
		// Build editor configuration
		const richTextEditorConfig = buildEditorConfig({ features: config.features, standAlone });

		features = richTextEditorConfig.features;
		editor = new Editor({
			...richTextEditorConfig.tiptap,
			element,
			editable: field.editable
		});

		if (field.value?.content) {
			try {
				editor.commands.setContent(field.value.content);
			} catch (err) {
				editor.commands.setContent('');
				console.log(err);
			}
		}

		// Update field value when editor content changes
		editor.on('update', ({ editor }) => {
			field.value = editor.getJSON();
		});
	});
</script>

<fieldset
	class:rz-field-rich-text--standalone={standAlone}
	class="rz-field-rich-text {config.className || ''}"
	use:root={field}
>
	<Field.Label {config} for={path || config.name} />
	<Field.Error error={field.error} />

	<div class="rz-rich-text__editor-wrapper">
		<div bind:this={element} data-error={field.error ? 'true' : null} class="rz-rich-text__editor {className}"></div>

		{#if editor && editor.isEditable}
			{#if standAlone}
				<DragHandler {editor} />
				<Suggestion {editor} {features} />
			{/if}

			{#key key}
				<EditorBubbleMenu {features} {editor} {path} />
			{/key}
		{/if}
	</div>
</fieldset>

<style type="postcss">
	.rz-rich-text__editor-wrapper {
		position: relative;
	}

	.rz-field-rich-text {
		:global {
			.ProseMirror-gapcursor:after {
				border-top: 1px solid hsl(var(--rz-color-fg));
			}
		}
	}
	.rz-field-rich-text--standalone {
		margin-bottom: var(--rz-size-20);
		.rz-rich-text__editor {
			border: none;
		}
	}

	.rz-field-rich-text--standalone :global {
		.rz-field-label {
			display: none;
		}
		.rz-rich-text__editor {
			background-color: transparent;
		}
		.rz-rich-text__editor:has(.ProseMirror-focused) {
			box-shadow: none;
		}
	}
</style>

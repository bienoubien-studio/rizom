<script lang="ts">
	import { type DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	import { Field } from 'rizom/panel';
	import type { ColorPickerField } from './types';

	type Props = { path: string; config: ColorPickerField; form: DocumentFormContext };
	const { path, config, form }: Props = $props();

	const field = $derived(form.useField(path, config));
</script>

<Field.Root visible={field.visible} disabled={form.readOnly} class="rz-checkbox-field">
	<Field.Label {config} />
	<button
		type="button"
		class:active={field.value === 'blue'}
		onclick={() => (field.value = 'blue')}
	>
		blue
	</button>
	<button type="button" class:active={field.value === 'red'} onclick={() => (field.value = 'red')}
		>red</button
	>
</Field.Root>

<style lang="postcss">
	.active {
		color: red;
	}
</style>

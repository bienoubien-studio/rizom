<script lang="ts">
	import type { DocumentFormContext } from 'rizom/panel/context/documentForm.svelte';
	import Button from '../../ui/button/button.svelte';
	import { ChevronLeft } from '@lucide/svelte';
	import ButtonSave from './ButtonSave.svelte';

	type Props = { form: DocumentFormContext; onClose: any };
	const { form, onClose }: Props = $props();
</script>

<div class="rz-floating-ui">
	<Button icon={ChevronLeft} onclick={onClose} variant="secondary" size="icon"></Button>
	<ButtonSave
		class="rz-floating-ui__save"
		disabled={!form.canSubmit}
		processing={form.processing}
	/>
</div>

<style>
	.rz-floating-ui {
		position: sticky;
		width: calc(100% - var(--rz-size-4));
		bottom: var(--rz-size-2);
		margin-left: var(--rz-size-2);
		margin-right: var(--rz-size-2);
		height: var(--rz-size-14);
		background-color: hsl(var(--rz-ground-5));
		padding: var(--rz-size-2);
		border-radius: var(--rz-radius-md);
		z-index: 1000;
		display: flex;
		gap: var(--rz-size-2);

		:global(.rz-floating-ui__save) {
			flex: 1;
		}
	}
</style>

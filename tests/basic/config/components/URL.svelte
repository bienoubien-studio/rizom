<script lang="ts">
	import { Link } from '@lucide/svelte';
	import type { DocumentFormContext } from '$lib/panel/context/documentForm.svelte';
	
	const { form }: { form: DocumentFormContext<any> }= $props();
</script>

{#if form.doc.url}
	<a href={form.doc.url} class="rz-comp-url" target="_blank">
		<Link size="12" />
		{form.doc.url}
	</a>
{/if}

<style>
	:root{
		--rz-comp-url-bg: light-dark(hsl(var(--rz-gray-13)), hsl(var(--rz-gray-4)))
	}
	.rz-comp-url {
		background-color: var(--rz-comp-url-bg);
		color: hsl(var(--rz-color-fg) / 1);
		border-radius: var(--rz-radius-md);
		border: var(--rz-border);
		display: inline-flex;
		gap: var(--rz-size-3);
		justify-content: flex-start;
		align-items: center;
		letter-spacing: 0.02em;
		padding: var(--rz-size-1) var(--rz-size-3);
		border: 1px solid hsl(var(--rz-input-border-color));
	}
</style>

<script lang="ts">
	import { t__ } from '$lib/core/i18n/index.js';
	import { RizomError, RizomFormError } from '$lib/core/errors/index.js';

	type Props = { error: string | false };

	const { error }: Props = $props();

	function formatError(error: string) {
		// subfield::error
		const cleanError = error.split('::').at(-1) ?? '';
		// If it's a predefined error from RizomError or RizomFormError
		if (Object.values(RizomError).includes(cleanError) || Object.values(RizomFormError).includes(cleanError)) {
			return t__(`errors.${cleanError}`);
		}
		// Otherwise return as-is (user defined message)
		return cleanError;
	}
</script>

{#if error}
	<div class="rz-field-error">
		{formatError(error)}
	</div>
{/if}

<style type="postcss">
	.rz-field-error {
		@mixin color ground-6;
		background-color: hsl(var(--rz-color-alert));
		position: absolute;
		right: 0;
		top: 0;
		border-radius: var(--rz-radius-sm);
		font-size: var(--rz-text-xs);
		@mixin px var(--rz-size-1);
		@mixin py var(--rz-size-0-5);
		@mixin font-medium;
	}
</style>

<script lang="ts">
	import { Input } from '$lib/panel/components/ui/input/index.js';
	import { Field } from '$lib/panel/components/fields/index.js';
	import { root } from '$lib/panel/components/fields/root.svelte.js';
	import type { TimeFieldProps } from './props';
	import { Clock } from '@lucide/svelte';

	const { path, config, form }: TimeFieldProps = $props();
	const field = $derived(form.useField(path || config.name, config));

	const onInput = (event: Event) => {
		field.value = (event.target as HTMLInputElement).value;
	};
</script>

<fieldset class="rz-time-field {config.className || ''}" use:root={field}>
	<Field.Label {config} />
	<div class="rz-time-field__input-wrapper">
		<Input
			type="time"
			id={path}
			name={path}
			data-error={field.error ? '' : null}
			value={field.value}
			oninput={onInput}
		/>
		<span class="rz-time-field__icon">
			<Clock size="12" />
		</span>
	</div>
	<Field.Error error={field.error} />
</fieldset>

<style>
	.rz-time-field__input-wrapper {
		display: flex;
		width: 200px;
		position: relative;
		:global {
			.rz-input {
				display: block;
			}
			@media (prefers-color-scheme: dark) {
				.rz-input {
					color-scheme: light;
				}
			}
			@media (prefers-color-scheme: light) {
				.rz-input {
					color-scheme: dark;
				}
			}
		}
	}

	.rz-time-field__icon {
		position: absolute;
		top: 0;
		bottom: 0;
		right: var(--rz-size-4);
		display: flex;
		align-items: center;
	}
</style>

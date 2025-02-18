<script lang="ts">
	import * as Card from 'rizom/panel/components/ui/card';
	import Button from 'rizom/panel/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { setFormContext } from 'rizom/panel/context/form.svelte';
	import { toast } from 'svelte-sonner';
	import { Toaster } from 'rizom/panel/components/ui/sonner';
	import Email from 'rizom/fields/email/component/Email.svelte';
	import Text from 'rizom/fields/text/component/Text.svelte';
	import type { FormErrors } from 'rizom/types';
	import { text } from 'rizom/fields';
	import { usersFields } from 'rizom/collection/auth/usersFields';
	import { t__ } from 'rizom/panel/i18n';
	import Pattern from 'rizom/panel/components/areas/illustration/Pattern.svelte';

	type Props = { form?: { email?: string; password?: string; errors?: FormErrors } };
	let { form }: Props = $props();

	const context = setFormContext(form || {}, 'init');

	$effect(() => {
		if (context.status === 'failure') {
			toast.warning('Invalid credential');
		}
	});
</script>

<Toaster />
<div class="rz-init">
	<Pattern />
	<form method="POST" use:enhance={context.enhance}>
		<h1>{t__('common.init')}</h1>
		<p>{t__('common.init_description')}</p>
		<Text config={text('name').layout('compact').required().toField()} form={context} />
		<Email config={usersFields.email.layout('compact').toField()} form={context} />
		<Text
			type="password"
			config={usersFields.password.layout('compact').toField()}
			form={context}
		/>

		<Button size="xl" disabled={!context.canSubmit} type="submit">Create</Button>
	</form>
</div>

<style type="postcs">
	.rz-init {
		display: grid;
		grid-template-columns: 1fr;
		@media (min-width: 768px) {
			grid-template-columns: 0.8fr 1.2fr;
		}
		height: 100vh;
		width: 100vw;
		background-color: hsl(var(--rz-ground-7));
		form {
			display: flex;
			flex-direction: column;
			justify-content: center;
			width: min(500px, 90%);
			gap: var(--rz-size-4);
			margin-bottom: 10vh;
			padding: var(--rz-size-20);
			border-left: var(--rz-border);
			h1 {
				font-size: var(--rz-text-6xl);
				@mixin font-semibold;
			}
			p {
				font-size: var(--rz-text-xl);
				color: hsl(var(--rz-ground-2));
			}
			:global(fieldset label) {
				display: none;
			}
			:global(fieldset .rz-field-error) {
				top: calc(-1 * var(--rz-size-6));
			}
			:global(fieldset input) {
				font-size: var(--rz-text-md);
				padding: 0 var(--rz-size-5);
				height: var(--rz-size-14);
			}
		}
	}
</style>

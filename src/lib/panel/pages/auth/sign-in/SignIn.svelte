<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import Email from '$lib/fields/email/component/Email.svelte';
	import Text from '$lib/fields/text/component/Text.svelte';
	import { setFormContext } from '$lib/panel/context/form.svelte';
	import { enhance } from '$app/forms';
	import type { FormErrors } from '$lib/types.js';
	import { t__ } from '$lib/core/i18n/index.js';
	import { toast } from 'svelte-sonner';
	import AuthForm from '$lib/panel/components/sections/auth/AuthForm.svelte';
	import { KeyRound } from '@lucide/svelte';
	import { emailField, passwordField } from '$lib/panel/pages/auth/fields.js';
	
	type Props = {
		data: {
			forgotPasswordEnabled: boolean;
			form: { email?: string; password?: string; errors?: FormErrors };
		};
	};
	const { data }: Props = $props();

	const context = setFormContext(data.form, 'login');

	$effect(() => {
		const formError = context.errors.get('_form');
		if (typeof formError === 'string') {
			toast.error(t__(`errors.${formError}`));
		}
	});
	
</script>

<AuthForm title={t__('common.signin')}>
	{#if context.status !== 429 }
	<form method="POST" action="/panel/sign-in" use:enhance={context.enhance}>
		<Email config={emailField} form={context} />
		<Text type="password" icon={KeyRound} config={passwordField} form={context} />
		<Button size="xl" disabled={!context.canSubmit} type="submit">Login</Button>

		{#if data.forgotPasswordEnabled}
			<Button variant="link" href="/forgot-password">
				{t__('common.forgotPassword')}
			</Button>
		{/if}

	</form>
	{:else}
		<p class="rz-locked">{t__(`errors.user_banned`)}</p>
	{/if}
</AuthForm>
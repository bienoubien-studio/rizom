<script lang="ts">
	import Button from '$lib/panel/components/ui/button/button.svelte';
	import Email from '$lib/fields/email/component/Email.svelte';
	import { setFormContext } from '$lib/panel/context/form.svelte';
	import { t__ } from '$lib/core/i18n/index.js';
	import { toast } from 'svelte-sonner';
	import AuthForm from '$lib/panel/components/sections/auth/AuthForm.svelte';
	import { authClient } from '$lib/panel/util/auth';
	import { emailField } from '$lib/panel/pages/auth/fields.js';
	
	const context = setFormContext({}, 'login');

	let success = $state(false);

	$effect(() => {
		const formError = context.errors.get('_form');
		if (typeof formError === 'string') {
			toast.error(t__(`errors.${formError}`));
		}
	});

	async function sendResetPasswordMail() {
		const { data, error } = await authClient.forgetPassword({
			email: context.form.email,
			redirectTo: `/reset-password`
		});
		if (error && error.message) {
			toast.error(error.message);
		}
		if (data && data.status) {
			success = data.status;
		}
	}
</script>

<AuthForm title={t__('common.forgotPassword')}>
	{#if success}
		<p>{t__('common.passwordResetLinkSent', context.form.email)}</p>
	{:else}
		<Email config={emailField} form={context} />
		<Button size="xl" disabled={!context.canSubmit} onclick={sendResetPasswordMail}>
			{t__('common.requestPasswordReset')}
		</Button>
	{/if}
</AuthForm>

<style lang="postcss">
	p {
		font-size: var(--rz-text-lg);
		@mixin font-semibold;
	}
</style>

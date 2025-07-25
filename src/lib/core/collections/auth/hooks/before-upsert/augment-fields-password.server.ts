import { Hooks } from '$lib/core/operations/hooks/index.js';
import { usersFields } from '../../fields.server.js';

export const augmentFieldsPassword = Hooks.beforeUpsert<'auth'>(async (args) => {
	let { config } = args;

	const IS_PASSWORD_AUTH = config.auth && typeof config.auth !== 'boolean' && config.auth.type === 'password';

	if (IS_PASSWORD_AUTH) {
		config = {
			...config,
			fields: [...config.fields, usersFields.password.raw, usersFields.confirmPassword.raw]
		};
	}

	return {
		...args,
		config
	};
});

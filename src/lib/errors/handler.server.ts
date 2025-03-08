import { error, fail, isRedirect, redirect, type NumericRange } from '@sveltejs/kit';
import type { FormErrors } from 'rizom/types/panel';
import { RizomError, RizomFormError } from './index';
import logger from 'rizom/util/logger';

export type ErrorContext = 'action' | 'api' | 'load';

type ErrorHandlerOptions = {
	context: ErrorContext;
	formData?: Record<string, any>; // For actions
};

export function handleError(err: unknown, options: ErrorHandlerOptions) {
	const { context, formData } = options;
	logger.error(err);

	if (err instanceof RizomFormError) {
		switch (context) {
			case 'action':
				return fail(400, {
					form: formData || {},
					errors: err.errors
				});
			case 'api':
				return error(400, err.message);
			// case 'load':
			// 	return error(400, err.errors);
		}
	}

	if (err instanceof RizomError) {
		if (err.code === RizomError.USER_BANNED && context === 'action') {
			throw redirect(302, '/locked');
		}
		return error(err.status, err.message);
	}

	// Redirect error
	if (isRedirect(err)) {
		return redirect(err.status, err.location);
	}

	// Unknown errors
	return error(500, 'Internal Server Error');
}

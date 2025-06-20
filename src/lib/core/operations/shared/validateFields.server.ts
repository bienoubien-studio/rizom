import { RizomFormError } from '$lib/core/errors/index.js';
import { deleteValueAtPath, getValueAtPath, setValueAtPath } from '$lib/util/object';
import { logger } from '$lib/core/logger/index.server';
import type { CompiledArea, CompiledCollection } from '$lib/core/config/types/index.js';
import type { GenericDoc } from '$lib/core/types/doc.js';
import type { FormErrors } from '$lib/panel/types.js';
import type { ConfigMap } from '../configMap/types.js';
import type { DeepPartial } from '$lib/util/types';
import type { RequestEvent } from '@sveltejs/kit';

export const validateFields = async <T extends GenericDoc>(args: {
	data: DeepPartial<T>;
	event: RequestEvent;
	locale?: string;
	config: CompiledArea | CompiledCollection;
	configMap: ConfigMap;
	original?: T;
	operation: 'create' | 'update';
}) => {
	const errors: FormErrors = {};
	const { event, locale, configMap, original, operation } = args;
	const { user, rizom } = event.locals;

	const slug = args.config.slug;
	const isCollection = rizom.config.isCollection(slug);
	let output = { ...args.data };

	for (const [key, config] of Object.entries(configMap)) {
		let value: any = getValueAtPath(key, output);

		/****************************************************/
		/* Validation
		/****************************************************/

		// Required
		if (config.required && config.isEmpty(value)) {
			errors[key] = RizomFormError.REQUIRED_FIELD;
		}

		// Unique
		/** @TODO better unique check like relations, locale,...
		 *   possible to handle this with a try catch at DB operation
		 *   and parse the sqlite error ??
		 */
		if ('unique' in config && config.unique && isCollection) {
			const query =
				operation === 'create'
					? `where[${key}][equals]=${value}`
					: `where[and][0][${key}][equals]=${value}&where[and][1][id][not_equals]=${original?.id}`;
			const existing = await rizom.collection(slug).find({ locale, query });
			if (existing.length) {
				errors[key] = RizomFormError.UNIQUE_FIELD;
			}
		}
		
		/****************************************************/
		/* Field hook before validate
		/****************************************************/

		if (config.hooks?.beforeValidate) {
			if (value) {
				for (const hook of config.hooks.beforeValidate) {
					value = await hook(value, { config, event });
					output = setValueAtPath(output, key, value);
				}
			}
		}

		/****************************************************/
		/* Validate
		/****************************************************/

		if (config.validate && value) {
			try {
				const valid = config.validate(value, {
					data: output as Partial<GenericDoc>,
					operation,
					id: original?.id,
					user: user,
					locale,
					config
				});
				if (valid !== true) {
					errors[key] = valid;
				}
			} catch {
				logger.warn(`Error while validating field ${key}`);
				errors[key] = RizomFormError.VALIDATION_ERROR;
			}
		}

		/****************************************************/
		/* Field hook before Save
		/****************************************************/

		if (config.hooks?.beforeSave) {
			if (value) {
				for (const hook of config.hooks.beforeSave) {
					value = await hook(value, { config, event });
					output = setValueAtPath(output, key, value);
				}
			}
		}

		/****************************************************/
		/* Access
		/****************************************************/

		if (config.access && config.access.update && operation === 'update') {
			const authorizedFieldUpdate = config.access.update(user, {
				id: original?.id
			});
			if (!authorizedFieldUpdate) {
				output = deleteValueAtPath(output, key);
			}
		}

		if (config.access && config.access.create && operation === 'create') {
			const authorizedFieldCreate = config.access.create(user, {
				id: undefined
			});
			if (!authorizedFieldCreate) {
				output = deleteValueAtPath(output, key);
			}
		}
	}

	if (Object.keys(errors).length) {
		throw new RizomFormError(errors);
	}

	return output;
};

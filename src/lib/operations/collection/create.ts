import cloneDeep from 'clone-deep';
import { RizomError } from 'rizom/errors/index.js';
import { usersFields } from 'rizom/config/auth/usersFields.js';
import { mergeWithBlankDocument } from '../tasks/mergeWithBlank.js';
import { setDefaultValues } from '../tasks/setDefaultValues.js';
import { buildConfigMap } from '../tasks/configMap/index.server.js';
import { validateFields } from '../tasks/validateFields.server.js';
import { saveTreeBlocks } from '../tasks/tree/index.server.js';
import { saveBlocks } from '../tasks/blocks/index.server.js';
import { saveRelations } from '../tasks/relations/index.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from 'rizom/sqlite/index.server.js';
import type { CompiledCollection } from 'rizom/types/config.js';
import type { LocalAPI } from 'rizom/operations/localAPI/index.server.js';
import type { GenericDoc, CollectionSlug } from 'rizom/types/doc.js';
import type { RegisterCollection } from 'rizom';
import type { DeepPartial } from 'rizom/types/util.js';

type Args<T> = {
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledCollection;
	api: LocalAPI;
	event: RequestEvent & {
		locals: App.Locals;
	};
	adapter: Adapter;
};

export const create = async <T extends GenericDoc>(args: Args<T>) => {
	const { config, event, adapter, locale, api } = args;

	let data = args.data;
	const incomingData = cloneDeep(data);
	//

	const authorized = config.access.create(event.locals.user, { id: undefined });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	if (config.auth) {
		/** Add auth fields into validation process */
		config.fields.push(usersFields.password.raw, usersFields.confirmPassword.raw);
	}

	data = mergeWithBlankDocument({
		data: data,
		config
	});

	const configMap = buildConfigMap(data, config.fields);

	// throw new Error('thats an error');

	data = await setDefaultValues({ data, adapter, configMap });
	data = await validateFields({
		data,
		api,
		locale,
		config,
		configMap,
		operation: 'create',
		user: event.locals.user
	});

	for (const hook of config.hooks?.beforeCreate || []) {
		const result = await hook({
			//@ts-ignore
			data,
			config,
			operation: 'create',
			api,
			rizom: event.locals.rizom,
			event
		});
		data = result.data as Partial<T>;
	}

	const incomingPaths = Object.keys(configMap);

	const createdId = await adapter.collection.insert({
		slug: config.slug,
		data,
		locale
	});

	const blocksDiff = await saveBlocks({
		parentId: createdId,
		configMap,
		data,
		incomingPaths,
		adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		parentId: createdId,
		configMap,
		data,
		incomingPaths,
		adapter,
		config,
		locale
	});

	await saveRelations({
		parentId: createdId,
		configMap,
		data,
		incomingPaths,
		adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});

	let document = (await api.collection(config.slug).findById({ id: createdId, locale })) as T;

	if (locale) {
		const locales = event.locals.rizom.config.getLocalesCodes();
		if (locales.length) {
			if ('file' in incomingData) {
				delete incomingData.file;
			}
			if ('filename' in incomingData) {
				delete incomingData.filename;
			}
			const otherLocales = locales.filter((code) => code !== locale);
			for (const otherLocale of otherLocales) {
				api.enforceLocale(otherLocale);
				await api
					.collection(config.slug)
					//@ts-ignore
					.updateById({ id: createdId, data: incomingData, locale: otherLocale });
			}
		}
		api.enforceLocale(locale);
	}

	for (const hook of config.hooks?.afterCreate || []) {
		await hook({
			doc: document as RegisterCollection[CollectionSlug],
			config,
			operation: 'create',
			api,
			rizom: event.locals.rizom,
			event
		});
	}

	return { doc: document };
};

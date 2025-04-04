import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from 'rizom/sqlite/index.server.js';
import type { CompiledArea } from 'rizom/types/config.js';
import type { LocalAPI } from 'rizom/operations/localAPI/index.server.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import { RizomError } from 'rizom/errors/index.js';
import { validateFields } from '../tasks/validateFields.server.js';
import { buildConfigMap } from '../tasks/configMap/index.server.js';
import { saveBlocks } from '../tasks/blocks/index.server.js';
import { saveTreeBlocks } from '../tasks/tree/index.server.js';
import { saveRelations } from '../tasks/relations/index.server.js';
import type { DeepPartial } from 'rizom/types/util.js';

type UpdateArgs<T> = {
	data: DeepPartial<T>;
	locale?: string | undefined;
	config: CompiledArea;
	event: RequestEvent;
	adapter: Adapter;
	api: LocalAPI;
};

export const update = async <T extends GenericDoc>(args: UpdateArgs<T>) => {
	//
	const { config, event, adapter, locale, api } = args;
	let data = args.data;

	const authorized = config.access.update(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const original = (await api.area(config.slug).find({ locale })) as T;
	const originalConfigMap = buildConfigMap(original, config.fields);
	const configMap = buildConfigMap(data, config.fields);

	data = await validateFields({
		data,
		api,
		locale,
		config,
		configMap,
		original,
		operation: 'update',
		user: event.locals.user
	});

	for (const hook of config.hooks?.beforeUpdate || []) {
		const result = await hook({
			data,
			config,
			originalDoc: original,
			operation: 'update',
			api,
			rizom: event.locals.rizom,
			event
		});
		data = result.data as Partial<T>;
	}

	const incomingPaths = Object.keys(configMap);

	await adapter.area.update({
		slug: config.slug,
		data,
		locale
	});

	const blocksDiff = await saveBlocks({
		parentId: original.id,
		configMap,
		data,
		incomingPaths,
		original,
		originalConfigMap,
		adapter,
		config,
		locale
	});

	const treeDiff = await saveTreeBlocks({
		parentId: original.id,
		configMap,
		data,
		incomingPaths,
		original,
		originalConfigMap,
		adapter,
		config,
		locale
	});

	await saveRelations({
		parentId: original.id,
		configMap,
		data,
		incomingPaths,
		adapter,
		config,
		locale,
		blocksDiff,
		treeDiff
	});

	const document = await api.area(config.slug).find({ locale });

	for (const hook of config.hooks?.afterUpdate || []) {
		await hook({
			doc: document,
			config,
			operation: 'update',
			api,
			rizom: event.locals.rizom,
			event
		});
	}

	return document as T;
};

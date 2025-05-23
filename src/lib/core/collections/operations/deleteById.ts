import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { LocalAPI } from '$lib/core/operations/local-api.server.js';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import { RizomError } from '$lib/core/errors/index.js';

type DeleteArgs = {
	id: string;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
};

export const deleteById = async <T extends GenericDoc>(args: DeleteArgs): Promise<string> => {
	const { event, id, config, api, adapter } = args;

	const authorized = config.access.delete(event.locals.user, { id });
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED);
	}

	const document = (await adapter.collection.findById({ slug: config.slug, id })) as T;
	if (!document) {
		throw new RizomError(RizomError.NOT_FOUND);
	}

	for (const hook of config.hooks?.beforeDelete || []) {
		await hook({
			doc: document as RegisterCollection[CollectionSlug],
			config,
			operation: 'delete',
			api,
			rizom: event.locals.rizom,
			event
		});
	}

	await adapter.collection.deleteById({ slug: config.slug, id });

	for (const hook of config.hooks?.afterDelete || []) {
		await hook({
			doc: document as RegisterCollection[CollectionSlug],
			config,
			operation: 'delete',
			api,
			rizom: event.locals.rizom,
			event
		});
	}

	return args.id;
};

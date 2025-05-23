import type { RequestEvent } from '@sveltejs/kit';
import type { Adapter } from '$lib/adapter-sqlite/index.server.js';
import type { CompiledCollection } from '$lib/core/config/types/index.js';
import type { LocalAPI } from '$lib/core/operations/local-api.server.js';
import type { GenericDoc, CollectionSlug } from '$lib/core/types/doc.js';
import type { RegisterCollection } from '$lib/index.js';
import { RizomError } from '$lib/core/errors/index.js';
import { transformDocument } from '$lib/core/operations/shared/transformDocument.server';
import type { RawDoc } from '$lib/core/types/doc';
import type { OperationQuery } from '$lib/core/types/index.js';

type FindArgs = {
	query: OperationQuery;
	locale?: string | undefined;
	config: CompiledCollection;
	event: RequestEvent & { locals: App.Locals };
	adapter: Adapter;
	api: LocalAPI;
	sort?: string;
	depth?: number;
	limit?: number;
	offset?: number;
};

export const find = async <T extends GenericDoc>(args: FindArgs): Promise<T[]> => {
	//
	const { config, event, locale, adapter, sort, limit, offset, api, depth, query } = args;
	
	const authorized = config.access.read(event.locals.user, {});
	if (!authorized) {
		throw new RizomError(RizomError.UNAUTHORIZED, 'try to read ' + config.slug );
	}

	const documentsRaw = await adapter.collection.query({
		slug: config.slug,
		query,
		sort,
		limit,
		offset,
		locale
	});

	const processDocument = async (documentRaw: RawDoc) => {
		let document = await transformDocument<T>({
			raw: documentRaw,
			config,
			api,
			adapter,
			locale,
			depth,
			event
		});

		for (const hook of config.hooks?.beforeRead || []) {
			const result = await hook({
				doc: document as unknown as RegisterCollection[CollectionSlug],
				config,
				operation: 'read',
				api,
				rizom: event.locals.rizom,
				event
			});
			document = result.doc as unknown as T;
		}

		return document;
	};

	const documents = await Promise.all(documentsRaw.map((doc) => processDocument(doc)));

	return documents;
};

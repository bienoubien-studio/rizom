import { redirect, type Actions, type RequestEvent } from '@sveltejs/kit';
import { extractData } from '$lib/core/operations/shared/data.server.js';
import type { CollectionSlug } from '$lib/core/types/doc';
import { handleError } from '$lib/core/errors/handler.server';
import { trycatch } from '$lib/util/trycatch.js';
import { PARAMS } from '$lib/core/constant.js';

export default function (slug: CollectionSlug) {
	const actions: Actions = {
		/****************************************************/
		// Create
		/****************************************************/
		create: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;

			// A redirect parameter equals to 0 can be present if we're in a nested form
			// to prevent redirection after entry creation
			// ex: for relation creation
			const withoutRedirect = event.url.searchParams.get(PARAMS.REDIRECT) === '0';
			const draft = event.url.searchParams.get(PARAMS.DRAFT) === 'true';

			const [error, result] = await trycatch(
				rizom.collection(slug).create({
					data: await extractData(event.request),
					draft,
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			if (withoutRedirect) {
				return { doc: result.doc };
			}

			return redirect(303, `/panel/${slug}/${result.doc.id}`);
		},

		/****************************************************/
		// Update
		/****************************************************/
		update: async (event: RequestEvent) => {
			const { rizom, locale } = event.locals;
			const id = event.params.id || '';
			const versionId = event.url.searchParams.get(PARAMS.VERSION_ID) || undefined;
			const draft = event.url.searchParams.get(PARAMS.DRAFT) === 'true';

			const [error, doc] = await trycatch(
				rizom.collection(slug).updateById({
					id,
					data: await extractData(event.request),
					versionId,
					draft,
					locale
				})
			);

			if (error) {
				return handleError(error, { context: 'action' });
			}

			if (draft && 'versionId' in doc) {
				return redirect(303, `/panel/${slug}/${doc.id}/versions?versionId=${doc.versionId}`);
			}

			return { doc };
		}
	};

	return actions;
}

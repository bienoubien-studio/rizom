import { extractData } from 'rizom/operations/data.server.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server.js';
import type { AreaSlug } from 'rizom/types/doc.js';
import { safe } from 'rizom/util/safe.js';

export default function (slug: AreaSlug) {
	//
	async function POST(event: RequestEvent) {
		const { api, locale } = event.locals;

		const paramLocale = event.url.searchParams.get('locale');
		const data = await extractData(event.request);

		const [error, doc] = await safe(
			api.area(slug).update({ data, locale: paramLocale || data.locale || locale })
		);

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return POST;
}

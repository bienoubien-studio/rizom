import { json, type RequestEvent } from '@sveltejs/kit';
import { handleError } from 'rizom/errors/handler.server';
import type { GlobalSlug } from 'rizom/types/doc';
import { safe } from 'rizom/utils/safe';

export default function (slug: GlobalSlug) {
	//
	async function GET(event: RequestEvent) {
		const { api, locale } = event.locals;

		const paramLocale = event.url.searchParams.get('locale');
		const paramDepth = event.url.searchParams.get('depth');
		const depth = typeof paramDepth === 'string' ? parseInt(paramDepth) : 0;

		const [error, doc] = await safe(
			api.global(slug).find({ locale: paramLocale || locale, depth })
		);

		if (error) {
			return handleError(error, { context: 'api' });
		}

		return json({ doc });
	}

	return GET;
}

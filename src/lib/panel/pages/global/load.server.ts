import type { ServerLoadEvent } from '@sveltejs/kit';
import type { PrototypeSlug } from 'rizom/types/doc';

export default function (slug: PrototypeSlug) {
	const load = async ({ locals }: ServerLoadEvent) => {
		const { api, locale } = locals;

		const global = api.global(slug);
		const authorizedRead = global.config.access.read(locals.user);
		const authorizedUpdate = global.config.access.update(locals.user);

		if (!authorizedRead && !authorizedUpdate) {
			return { doc: {}, operation: 'update', status: 401 };
		}

		const doc = await api.global(slug).find({ locale });

		if (authorizedRead && !authorizedUpdate) {
			return { doc, operation: 'update', status: 200, readOnly: true };
		}

		return {
			doc,
			operation: 'update',
			status: 200,
			slug
		};
	};
	return load;
}

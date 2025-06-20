import { error, type ServerLoadEvent } from '@sveltejs/kit';
import { checkLiveRedirect } from 'rizom/panel/index.server';

export const load = async (event: ServerLoadEvent) => {
	const { rizom } = event.locals;
	let { parentSlug, slug } = event.params;

	const locale = parentSlug === 'news' ? 'en' : 'fr';
	
	const query = `where[attributes.slug][equals]=${slug}`;
	const docs = await rizom.collection('news').find({ query, locale, depth: 2 });
	if (!docs.length) {
		throw error(404, 'Not found');
	}

	checkLiveRedirect(docs[0], event);

	return { doc: docs[0] };
};

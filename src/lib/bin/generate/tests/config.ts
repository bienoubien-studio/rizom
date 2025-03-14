import { access } from '$lib/util/access/index.js';
import { Newspaper, ReceiptText } from '@lucide/svelte';
import { Text } from '@lucide/svelte';
import type { CollectionHookBeforeUpsert } from 'rizom/types/hooks';
import type { Config } from 'rizom/index.js';

import {
	block,
	blocks,
	date,
	link,
	relation,
	richText,
	tab,
	tabs,
	text,
	toggle,
	slug
} from 'rizom/fields/index.js';
import { collection } from '$lib/config/build/collection/builder.js';
import { area } from '$lib/config/build/area/builder.js';

const Informations = area<any>('infos', {
	icon: ReceiptText,
	group: 'informations',
	fields: [
		richText('about').localized(),
		text('email'),
		text('instagram'),
		link('legals').localized()
	],
	access: {
		read: () => true
	},
	url: (doc) => {
		if (doc.locale === 'fr') {
			return `${process.env.PUBLIC_RIZOM_URL}/about`;
		}
		return `${process.env.PUBLIC_RIZOM_URL}/${doc.locale}/about`;
	},
	live: true
});

/////////////////////////////////////////////
// Pages
//////////////////////////////////////////////

const setHome: CollectionHookBeforeUpsert<any> = async (args) => {
	const { data, api } = args;

	if (data?.home) {
		const query = 'where[home][equals]=true';
		const pagesIsHome = await api.collection('pages').find({ query });
		for (const page of pagesIsHome) {
			await api.collection<any>('pages').updateById({
				id: page.id,
				data: { home: false }
			});
		}
	}

	return args;
};

const formatslug: CollectionHookBeforeUpsert<any> = async (args) => {
	const { data, api, operation, event } = args;

	if (operation === 'create' || operation === 'update') {
		if (data.slug) {
			const baseSlug = data.slug;
			const query = `where[slug][equals]${data.slug}`;
			let index = 0;

			const pagesWithCurrentSlug = await api.collection('pages').find({
				query,
				locale: event.locals.locale
			});

			while (pagesWithCurrentSlug.some((page) => page.slug === data.slug)) {
				index++;
				data.slug = `${baseSlug}-${index}`;
			}
		}

		return {
			...args,
			data
		};
	}
	return args;
};

const blockParagraph = block('paragraph')
	.icon(Text)
	.description('Simple paragraph')
	.fields(richText('text').localized());

const tabAttributes = tab('Attributes').fields(
	text('title').isTitle().localized().required(),
	toggle('home').table({ position: 2, sort: true }).live(false),
	slug('slug')
		.slugify('title')
		.live(false)
		.table({ position: 3, sort: true })
		.localized()
		.required(),

	relation('related').to('pages').many(),
	date('published')
);

const tabContent = tab('Layout').fields(blocks('components', [blockParagraph]).table());

const Pages = collection('pages', {
	icon: Newspaper,
	group: 'Content',
	fields: [tabs(tabContent, tabAttributes)],
	url: (doc) => {
		if (doc.locale === 'fr') {
			return `${process.env.PUBLIC_RIZOM_URL}/${doc.slug}`;
		}
		return `${process.env.PUBLIC_RIZOM_URL}/${doc.locale}/${doc.slug}`;
	},
	live: true,
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	},
	hooks: {
		beforeCreate: [formatslug, setHome],
		beforeUpdate: [formatslug, setHome]
	}
});

const config: Config = {
	//
	database: 'basic.sqlite',
	siteUrl: process.env.PUBLIC_RIZOM_URL,

	collections: [Pages],
	areas: [Informations],

	localization: {
		locales: [
			{ code: 'fr', label: 'Français', bcp47: 'fr-FR' },
			{ code: 'en', label: 'English', bcp47: 'en-US' }
		],
		default: 'fr'
	},

	panel: {
		access: (user) => access.hasRoles(user, 'admin', 'editor'),
		users: {
			roles: [{ value: 'admin', label: 'Administrator' }, { value: 'editor' }],
			fields: [text('website')],
			group: 'administration'
		}
	}

	// plugins: [colorPicker()]
};

export default config;

import { access } from '$lib/util/access/index.js';
import {
	block,
	blocks,
	date,
	link,
	radio,
	relation,
	richText,
	slug,
	tab,
	tabs,
	text,
	toggle,
	tree
} from '$lib/fields/index.js';
import { ListTree, Newspaper, ReceiptText, Settings2 } from '@lucide/svelte';
import { Images, Text } from '@lucide/svelte';
import { collection, area, defineConfig, Hooks } from '$lib';

/****************************************************
/* Settings
/****************************************************/

const Settings = area('settings', {
	icon: Settings2,
	panel: {
		group: 'informations'
	},
	fields: [
		toggle('minimalFooter').label('Minimal footer'),
		toggle('maintenance').label('Sticky header'),
		text('legalMention').label('Legals mentions').localized(),
		relation('logo').to('medias')
	],

	access: {
		read: (user) => access.hasRoles(user, 'admin')
	}
});

/****************************************************
/*  Menu
/****************************************************/

const linkField = link('link').types('pages', 'infos', 'url').required();

const nav = tree('nav').fields(linkField);
const mainNav = tree('mainNav').fields(linkField).localized();

const Menu = area('menu', {
	panel: {
		group: 'Content'
	},
	icon: ListTree,
	access: {
		read: () => true
	},
	fields: [nav, mainNav]
});

/****************************************************
/* Informations
/****************************************************/

const Informations = area('infos', {
	icon: ReceiptText,
	panel: {
		group: 'informations'
	},
	fields: [richText('about').localized(), text('email').required(), text('instagram'), link('legals').localized()],
	access: {
		read: () => true
	},
	url: (doc: any) => {
		return `${process.env.PUBLIC_RIZOM_URL}/${doc.locale}/about`;
	},
	live: true
});

/****************************************************
/* Pages
/****************************************************/

const setHome = Hooks.beforeUpsert<'pages'>(async (args) => {
	const { data, event } = args;

	if (data?.attributes?.isHome) {
		const query = `where[attributes.isHome][equals]=true`;

		const pagesIsHome = await event.locals.rizom.collection('pages').find({ query });

		for (const page of pagesIsHome) {
			await event.locals.rizom.collection('pages').updateById({
				id: page.id,
				data: { attributes: { isHome: false } }
			});
		}
	}

	return args;
});

const formatslug = Hooks.beforeUpsert<'pages'>( async (args) => {
	const { operation, event } = args;
	let data = args.data;

	const queryPagesWithSlug = async ({ slug }: { slug: string }) => {
		const query = `where[attributes.slug][equals]=${slug}`;
		return event.locals.rizom.collection('pages').find({
			query,
			locale: event.locals.locale
		});
	};

	if (operation === 'create' || operation === 'update') {
		let slug = data.attributes?.slug;
		if (slug) {
			const baseSlug = slug;
			let suffix = 0;
			let pagesWithCurrentSlug = await queryPagesWithSlug({ slug: baseSlug });
			while (pagesWithCurrentSlug.some((page) => page.attributes.slug === slug)) {
				suffix++;
				slug = `${baseSlug}-${suffix}`;
				pagesWithCurrentSlug = await queryPagesWithSlug({ slug });
			}
			data = {
				...data,
				attributes: {
					...(data.attributes || {}),
					slug
				}
			};
		}

		return {
			...args,
			data
		};
	}
	return args;
});

const blockParagraph = block('paragraph')
	.icon(Text)
	.description('Simple paragraph')
	.fields(richText('text').localized());

const blockSlider = block('slider').icon(Images).description('Simple slider').fields(text('image'));
const blockImage = block('image').fields(relation('image').to('medias'), text('legend'));

const tabHero = tab('hero').fields(
	radio('heroType').options('banner', 'text').defaultValue('banner'),
	relation('image')
		.to('medias')
		.condition((doc) => {
			return doc.heroType === 'banner';
		}),
	richText('intro').features('bold')
);

const tabAttributes = tab('attributes').fields(
	text('title').isTitle().localized().required(),
	toggle('isHome').table({ position: 2, sort: true }).live(false),
	slug('slug').slugify('attributes.title').live(false).table({ position: 3, sort: true }).localized().required(),

	relation('related').to('pages').many(),
	relation('author').to('staff'),
	relation('contributors').to('staff').many(),
	relation('ambassadors').to('staff').many().localized(),
	date('published')
);

const tabContent = tab('layout').fields(
	blocks('components', [blockParagraph, blockSlider, blockImage]).table().localized()
);

const tabSeo = tab('seo').fields(text('metaTitle').localized(), text('metaDescription').localized());

const tabFooter = tab('footer').fields(text('slider').localized());

const Pages = collection('pages', {
	icon: Newspaper,
	panel: {
		group: 'Content'
	},
	fields: [tabs(tabHero, tabContent, tabAttributes, tabSeo, tabFooter)],
	url: (doc) => {
		return `${process.env.PUBLIC_RIZOM_URL}/${doc.locale}/${doc.attributes.slug}`;
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

/****************************************************
/* Medias
/****************************************************/

const Medias = collection('medias', {
	icon: Images,
	panel: {
		group: 'Medias'
	},
	upload: {
		imageSizes: [
			{ name: 'thumbnail', width: 400, out: ['webp'] },
			{ name: 'small', width: 720, out: ['webp'] },
			{ name: 'medium', width: 720, height: 1024, out: ['webp'] },
			{ name: 'large', width: 1080, out: ['webp'] }
		]
	},
	fields: [text('alt').required()],
	access: {
		read: () => true
	}
});

export default defineConfig({
	//
	database: 'multilang.sqlite',
	siteUrl: process.env.PUBLIC_RIZOM_URL,

	collections: [Pages, Medias],
	areas: [Settings, Informations, Menu],

	localization: {
		locales: [
			{ code: 'fr', label: 'Français' },
			{ code: 'en', label: 'English' }
		],
		default: 'fr'
	},

	// cors: ['localhost:5173', 'rizom.test:5173'],

	panel: {
		language: 'fr',
		access: (user) => access.hasRoles(user, 'admin', 'editor'),
		users: {
			roles: [{ value: 'admin', label: 'Administrator' }, { value: 'editor' }],
			fields: [text('website')],
			panel: {
				group: 'administration'
			},
			// TODO create an author collection for testing
			// here users shouldn't be read
			access: {
				read: () => true
			}
		}
	}
});

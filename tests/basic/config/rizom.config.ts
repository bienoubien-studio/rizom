import {
	relation,
	richText,
	text,
	toggle,
	slug,
	tabs,
	tab,
	blocks,
	block,
	link,
	email,
	select,
	date,
	group,
	component,
	separator,
	tree,
	textarea
} from '$lib/fields/index.js';
import { access } from '$lib/util/access/index.js';
import {
	AppWindowMac,
	BookType,
	Contact,
	Images,
	Menu,
	Newspaper,
	Settings2,
	SlidersVertical,
	NotebookText
} from '@lucide/svelte';

import { collection, area, defineConfig, Hooks } from '$lib/index.js';
import URL from './components/URL.svelte';
import LoremFeature from './lorem-fill.js';

const tabSEO = tab('metas')
	.label('SEO')
	.fields(text('title').label('Meta title').layout('compact'), textarea('description').label('Meta description'))
	.live(false);

const tabAttributes = tab('attributes')
	.label('Attributes')
	.fields(
		text('title').isTitle().required().layout('compact'),
		component(URL),
		toggle('isHome').label('Homepage').live(false).table(2),
		slug('slug')
			.slugify('attributes.title')
			.condition((_, siblings) => siblings.isHome !== true)
			.live(false),
		separator(),
		group('summary').fields(relation('thumbnail').to('medias'), richText('intro')),
		separator(),
		select('template')
			.options('basic', 'large')
			.access({
				create: (user) => access.isAdmin(user),
				update: (user) => access.isAdmin(user),
				read: () => true
			})
	);

const blockKeyFacts = block('keyFacts').fields(
	tree('facts')
		.fields(
			//
			text('title'),
			richText('description'),
			select('icon').options('one', 'two'),
			relation('image').to('medias')
		)
		.renderTitle(({ values }) => values.title)
);

const blockParagraph = block('paragraph').fields(richText('text'));
const blockImage = block('image').fields(relation('image').to('medias').query(`where[mimeType][like]=image`));
const blockSlider = block('slider').fields(relation('images').to('medias').many());
const blockSubContent = block('content').fields(text('title'), richText('text'));
const blockBlack = block('black').fields(
	text('title'),
	blocks('text', [blockParagraph, blockImage, blockSlider, blockSubContent])
);
const tabLayout = tab('layout')
	.label('Layout')
	.fields(
		group('hero').fields(text('title').isTitle(), text('intro'), relation('image').to('medias')),
		separator(),
		blocks('sections', [blockParagraph, blockImage, blockSlider, blockKeyFacts, blockBlack])
	);

const clearCacheHook = Hooks.afterUpsert<'pages'>(async (args) => {
	args.event.locals.rizom.cache.clear();
	return args;
});

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

const Pages = collection('pages', {
	label: { singular: 'Page', plural: 'Pages', gender: 'f' },
	panel: {
		group: 'content',
		description: 'Edit and create your website pages'
	},
	icon: Newspaper,
	fields: [tabs(tabAttributes, tabLayout, tabSEO)],
	live: true,
	nested: true,
	url: (doc) =>
		doc.attributes.isHome
			? `${process.env.PUBLIC_RIZOM_URL}/`
			: `${process.env.PUBLIC_RIZOM_URL}/[...parent.attributes.slug]/${doc.attributes.slug}`,
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	},
	hooks: {
		afterUpdate: [clearCacheHook],
		afterCreate: [clearCacheHook],
		beforeCreate: [setHome],
		beforeUpdate: [setHome]
	}
});

const Link = [text('label').layout('compact'), link('link').types('pages', 'url').layout('compact')];

const Navigation = area('navigation', {
	icon: Menu,
	panel: {
		group: 'global',
		description: 'Define your website navigation'
	},
	fields: [
		//
		tabs(
			tab('header').fields(
				tree('mainNav')
					.fields(...Link)
					.renderTitle(({ values }) => values.label || 'Lien')
					.label('Menu principal')
					.addItemLabel('Ajouter un lien')
			),
			tab('footer').fields(tree('footerNav').fields(...Link))
		)
	],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	}
});

const Settings = area('settings', {
	icon: Settings2,
	panel: {
		group: 'system',
		description: 'System settings, maintenance and more'
	},
	fields: [toggle('maintenance').label('Maintenance').required(), relation('logo').to('medias')],
	access: {
		read: (user) => access.hasRoles(user, 'admin')
	}
});

const Informations = area('infos', {
	icon: Contact,
	panel: {
		group: 'global',
		description: 'Update your website information, email, name of the website,...'
	},
	fields: [email('email'), slug('instagram').placeholder('nom-du-compte'), textarea('address').label('Adresse')],
	access: {
		read: () => true
	}
});

const tabWriter = tab('writer').fields(
	richText('text').features(
		'bold',
		'italic',
		LoremFeature,
		'resource:pages',
		'media:medias?where[mimeType][like]=image',
		'heading:2,3',
		'link'
	)
);

const tabNewsAttributes = tab('attributes').fields(
	text('title').isTitle().localized().required(),
	slug('slug').slugify('attributes.title').live(false).table({ position: 3, sort: true }).localized().required(),
	richText('intro').features('bold', 'link'),
	date('published')
);

const News = collection('news', {
	icon: NotebookText,
	panel: {
		description: 'Create article for your readers',
		group: 'content'
	},
	fields: [tabs(tabNewsAttributes, tabWriter)],
	live: true,
	url: (doc) => `${process.env.PUBLIC_RIZOM_URL}/actualites/${doc.attributes.slug}`,
	access: {
		read: () => true,
		create: (user) => access.isAdmin(user),
		update: (user) => access.hasRoles(user, 'admin', 'editor')
	}
});

const Medias = collection('medias', {
	label: { singular: 'Media', plural: 'Medias', gender: 'm' },
	panel: {
		description: 'Manage images, video, audio, documents,...',
		group: 'content'
	},
	upload: {
		imageSizes: [
			{ name: 'sm', width: 640, out: ['webp'] },
			{ name: 'md', width: 1024, out: ['webp'] },
			{ name: 'lg', width: 1536, out: ['webp'] },
			{ name: 'xl', width: 2048, out: ['webp'] }
		]
	},
	icon: Images,
	fields: [text('alt').required()],
	access: {
		read: () => true
	}
});

const Users = collection('users', {
	auth: {
		type: 'password',
		roles: ['user']
	},
	fields: [text('website')],
	access: {
		create: () => true,
		read: () => true,
		update: (user, { id }) => access.isAdminOrMe(user, id),
		delete: (user, { id }) => access.isAdminOrMe(user, id)
	}
});

const Apps = collection('apps', {
	auth: {
		type: 'apiKey',
		roles: ['apps']
	},
	fields: [],
	access: {
		create: (user) => access.isAdmin(user),
		read: (user) => access.isAdmin(user),
		update: (user, { id }) => access.isAdmin(user),
		delete: (user, { id }) => access.isAdmin(user)
	}
});

export default defineConfig({
	database: 'basic.sqlite',
	collections: [Pages, Medias, News, Users, Apps],
	areas: [Settings, Navigation, Informations],
	smtp: {
		from: process.env.RIZOM_SMTP_USER,
		host: process.env.RIZOM_SMTP_HOST,
		port: parseInt(process.env.RIZOM_SMTP_PORT || '465'),
		auth: {
			user: process.env.RIZOM_SMTP_USER,
			password: process.env.RIZOM_SMTP_PASSWORD
		}
	},
	panel: {
		users: {
			roles: [{ value: 'editor' }]
		},
		navigation: {
			groups: [
				{ label: 'content', icon: BookType },
				{ label: 'global', icon: AppWindowMac },
				{ label: 'system', icon: SlidersVertical }
			]
		}
	}
});

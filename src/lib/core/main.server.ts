import createAdapter from '$lib/adapter-sqlite/index.server.js';
import { randomId } from '../util/random.js';
import { createConfigInterface } from './config/index.server.js';
import type { RequestEvent } from '@sveltejs/kit';
import type { AsyncReturnType } from '../util/types.js';
import type { Config } from '$lib/core/config/types/index.js';
import type { Plugins } from '$lib/core/types/plugins.js';
import { RizomError } from './errors/index.js';
import { registerTranslation } from '$lib/core/i18n/register.server.js';
import i18n from './i18n/index.js';
import { hasRunInitCommand } from './dev/cli/util.server.js';
import { logger } from './logger/index.server.js';

const dev = process.env.NODE_ENV === 'development';

function createRizom() {
	//
	let initialized = false;
	let adapter: ReturnType<typeof createAdapter>;
	let config: AsyncReturnType<typeof createConfigInterface>;
	const key: string = randomId(12);

	//////////////////////////////////////////////
	// Init
	//////////////////////////////////////////////

	const init = async ({ config: rawConfig, schema }: InitArgs) => {
		initialized = false;
		if (dev && !hasRunInitCommand()) {
			throw new RizomError(RizomError.INIT, 'Missing required files, run `npx rizom init`');
		}
		// Initialize config
		config = await createConfigInterface(rawConfig);

		// Initialize DB
		adapter = createAdapter({ schema, configInterface: config });

		// Panel Language
		const dictionnaries = await registerTranslation(config.raw.panel.language);
		i18n.init(dictionnaries);

		// Done
		initialized = true;
	};

	return {
		key,
		init,

		get initialized() {
			return initialized;
		},

		get auth() {
			return adapter.auth;
		},

		get adapter() {
			return adapter;
		},

		get config() {
			return config;
		},

		/**
		 * define the locale to use in the event
		 * based on this hierarchy :
		 * - locale inside the url ex: /en/foo
		 * - locale from searchParams
		 * - locale from cookie
		 * - default locale
		 */
		defineLocale({ event }: { event: RequestEvent }) {
			
			// locale present inside the url params ex : /en/foo
			const params = event.params;
			const paramLocale = params.locale;
			
			// locale present as a search param ex : ?locale=en
			const searchParams = event.url.searchParams;
			const hasParams = searchParams.toString();
			const searchParamLocale = hasParams && searchParams.get('locale');
			
			// locale from the cookie
			const cookieLocale = event.cookies.get('Locale');
			const defaultLocale = config.getDefaultLocale();
			const locale = paramLocale || searchParamLocale || cookieLocale;
			
			if (locale && config.getLocalesCodes().includes(locale)) {
				// event.cookies.set('Locale', locale, { path: '.' });
				return locale;
			}
			// event.cookies.set('Locale', defaultLocale, { path: '.' });
			return defaultLocale;
		},

		get plugins() {
			return config.get('plugins') as Plugins;
		}
	};
}

//////////////////////////////////////////////
// Singleton pattern
//////////////////////////////////////////////

let instance: Rizom;

const getInstance = () => {
	if (instance) {
		logger.info('import rizom instance ' + instance.key);
		return instance;
	}
	console.log('')
	logger.info('create rizom instance');
	instance = createRizom();
	return instance;
};

export default getInstance();

export type Rizom = ReturnType<typeof createRizom>;
type InitArgs = { config: Config; schema: any };

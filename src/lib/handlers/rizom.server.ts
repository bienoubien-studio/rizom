import { type Handle } from '@sveltejs/kit';
import rizom from '../rizom.server.js';
import { logger } from 'rizom/util/logger/index.server.js';
import { LocalAPI } from '../operations/localAPI/index.server.js';
import type { Config } from 'rizom/types/index.js';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const dev = process.env.NODE_ENV === 'development';

type Args = { config: Config; schema: any };

export function createCMSHandler({ config, schema }: Args) {
	// CMS Handler :
	// Initialize Rizom and add it to event.locals
	// Define current locale and add it to event.locals
	// Return the better-auth handler
	const handleCMS: Handle = async ({ event, resolve }) => {
		logger.info(`${event.request.method} ${event.url.pathname}`);
		
		if (dev || !rizom.initialized) {
			await rizom.init({ config, schema });
		}
		
		event.locals.api = new LocalAPI({ rizom, event });
		event.locals.rizom = rizom;
		event.locals.locale = rizom.defineLocale({ event });

		return svelteKitHandler({ event, resolve, auth: rizom.auth.betterAuth });
	};

	return handleCMS;
}

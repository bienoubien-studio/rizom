import { capitalize } from '$lib/util/string.js';
import { augmentTitle } from './augment-title.js';
import { augmentMetas } from './augment-metas.js';
import type { Area } from '$lib/core/config/types/index.js';
import type { AreaWithoutSlug } from './types.js';
import { augmentVersions } from './augment-versions.js';
import { FileText } from '@lucide/svelte';
import { augmentHooks } from './augment-hooks.js';
import { augmentUrl } from './augment-url.js';

const addSlug = <S extends string>(slug: S, config: AreaWithoutSlug<S>): Area<S> => ({ ...config, slug });

/**
 * Function to define an Area
 */
export function area<S extends string>(slug: S, incomingConfig: AreaWithoutSlug<S>): Area<S> {
	
	let config = addSlug(slug, incomingConfig);
	let fields: typeof config.fields = [...config.fields];
	
	config = augmentTitle(config);
	
	({ config, fields } = augmentMetas({ config, fields }));
	({ config, fields } = augmentVersions({ config, fields }));
	({ config, fields } = augmentUrl({ config, fields }));
	
	config = augmentHooks(config);

	return {
		...config,
		slug,
		icon: config.icon || FileText,
		label: config.label ? config.label : capitalize(slug),
		fields: fields,
		access: {
			create: (user) => !!user,
			read: (user) => !!user,
			update: (user) => !!user,
			delete: (user) => !!user,
			...config.access
		}
	}
}


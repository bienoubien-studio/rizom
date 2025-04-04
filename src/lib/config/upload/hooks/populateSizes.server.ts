import type { CompiledCollection } from 'rizom/types/config.js';
import type { GenericDoc } from 'rizom/types/doc.js';
import type { CollectionHookBeforeRead } from 'rizom/types/hooks.js';
import type { WithUpload } from 'rizom/types/util.js';

export const populateSizes: CollectionHookBeforeRead<GenericDoc> = async (args) => {
	const config = args.config as WithUpload<CompiledCollection>;
	const doc = args.doc;

	if ('imageSizes' in config && config.imageSizes) {
		doc.sizes = {};
		for (const size of config.imageSizes) {
			if (doc[size.name]) {
				// Handle multiple formats
				const formats = doc[size.name].split('|') as string[];

				if (formats.length > 1) {
					// Multiple formats
					doc.sizes[size.name] = {};
					formats.forEach((format) => {
						const extension = format.split('.').pop()!;
						doc.sizes[`${size.name}_${extension}`] = `/medias/${format}`;
					});
				} else {
					// Single format
					doc.sizes[size.name] = `/medias/${formats[0]}`;
				}

				delete doc[size.name];
			} else {
				// Default case: use original file as string
				doc.sizes[size.name] = `/medias/${doc.filename}`;
			}
		}
	}
	
	doc.url = `/medias/${doc.filename}`

	return { ...args, doc };
};

import type { GenericBlock } from 'rizom/types/doc.js';
import type { Dic } from 'rizom/types/util.js';
import type { ConfigMap } from '../configMap/types.js';
import { getValueAtPath } from 'rizom/util/object.js';

type ExtractBlocksArgs = {
	data: Dic;
	configMap: ConfigMap;
};

export function extractBlocks({ data, configMap }: ExtractBlocksArgs) {
	const blocks: GenericBlock[] = [];

	Object.entries(configMap).forEach(([path, config]) => {
		if (config.type === 'blocks') {
			const value = getValueAtPath<GenericBlock[]>(path, data);

			const isEmptyValue = config.isEmpty(value);

			if (value && !isEmptyValue) {
				value.forEach((block: Partial<GenericBlock>, index: number) => {
					if (block.type) {
						const cleanBlock = {
							...block,
							path: block.path || path,
							position: block.position ?? index
						};

						// Remove children blocks
						const finalBlock = Object.entries(cleanBlock).reduce((acc, [key, value]) => {
							const nestedPath = `${path}.${index}.${key}`;
							if (configMap[nestedPath]?.type === 'blocks') {
								return acc;
							}
							// @TODO should maybe remove tree also
							return { ...acc, [key]: value };
						}, {} as GenericBlock);

						blocks.push(finalBlock);
					}
				});
			}
		}
	});

	return blocks;
}

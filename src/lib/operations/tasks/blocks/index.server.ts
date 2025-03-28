import { extractBlocks } from './extract.server.js';
import { defineBlocksDiff } from './diff.server';
import type { Dic } from 'rizom/types/util.js';
import type { ConfigMap } from '../configMap/types.js';
import type { Adapter } from 'rizom/sqlite/index.server.js';
import { RizomError } from 'rizom/errors/index.js';
import type { CompiledArea, CompiledCollection } from 'rizom/types/config.js';
import type { GenericBlock } from 'rizom/types/doc.js';

export const saveBlocks = async (args: {
	configMap: ConfigMap;
	data: Dic;
	incomingPaths: string[];
	original?: Dic;
	originalConfigMap?: ConfigMap;
	adapter: Adapter;
	config: CompiledArea | CompiledCollection;
	parentId: string;
	locale?: string;
}) => {
	const {
		data,
		configMap,
		incomingPaths,
		original,
		originalConfigMap,
		adapter,
		config,
		parentId,
		locale
	} = args;

	const incomingBlocks = extractBlocks({
		data,
		configMap
	});

	let existingBlocks: GenericBlock[] = [];
	if (original) {
		if (!originalConfigMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing original');
		const blocks = extractBlocks({
			data: original,
			configMap: originalConfigMap
		});

		// filter path that are not present in incoming data
		// in order to not delete unmodified blocks fields
		existingBlocks = blocks.filter((block) => {
			return incomingPaths.some((path) => block.path?.startsWith(path));
		});
	}

	const blocksDiff = defineBlocksDiff({
		existingBlocks,
		incomingBlocks
	});

	if (blocksDiff.toDelete.length) {
		await Promise.all(
			blocksDiff.toDelete.map((block) => adapter.blocks.delete({ parentSlug: config.slug, block }))
		);
	}

	if (blocksDiff.toAdd.length) {
		await Promise.all(
			blocksDiff.toAdd.map((block) =>
				adapter.blocks.create({
					parentSlug: config.slug,
					parentId,
					block,
					locale
				})
			)
		);
	}

	if (blocksDiff.toUpdate.length) {
		await Promise.all(
			blocksDiff.toUpdate.map((block) =>
				adapter.blocks.update({ parentSlug: config.slug, block, locale: locale })
			)
		);
	}

	return blocksDiff;
};

import { extractTreeBlocks } from './extract.server';
import type { TreeBlock } from '$lib/types/doc';
import type { Dic, WithRequired } from '$lib/types/util';
import { defineTreeBlocksDiff } from './diff.server';
import type { Adapter, CompiledArea, CompiledCollection } from '$lib/types';
import type { ConfigMap } from '../configMap/types';

import { RizomError } from '$lib/errors/index.js';

export const saveTreeBlocks = async (args: {
	configMap: ConfigMap;
	data: Dic;
	incomingPaths: string[];
	original?: Dic;
	originalConfigMap?: ConfigMap;
	adapter: Adapter;
	config: CompiledArea | CompiledCollection;
	ownerId: string;
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
		ownerId,
		locale
	} = args;

	// Get incomings
	const incomingTreeBlocks = extractTreeBlocks({
		data,
		configMap
	});

	// Get existings
	let existingTreeBlocks: WithRequired<TreeBlock, 'path'>[] = [];
	if (original) {
		if (!originalConfigMap) throw new RizomError(RizomError.OPERATION_ERROR, 'missing original');
		const blocks = extractTreeBlocks({
			data: original,
			configMap: originalConfigMap
		});

		existingTreeBlocks = blocks.filter((block) => {
			// filter path that are not present in incoming data
			// in order to not delete unmodified blocks fields
			return incomingPaths.some((path) => block.path?.startsWith(path));
		});

	}

	const treeDiff = defineTreeBlocksDiff({
		existingBlocks: existingTreeBlocks,
		incomingBlocks: incomingTreeBlocks
	});


	// throw new Error("that's an error");
	if (treeDiff.toDelete.length) {
		await Promise.all(
			treeDiff.toDelete.map((block) => adapter.tree.delete({ parentSlug: config.slug, block }))
		);
	}

	if (treeDiff.toAdd.length) {
		await Promise.all(
			treeDiff.toAdd.map((block) =>
				adapter.tree.create({
					parentSlug: config.slug,
					ownerId,
					block,
					locale: locale
				})
			)
		);
	}

	if (treeDiff.toUpdate.length) {
		await Promise.all(
			treeDiff.toUpdate.map((block) =>
				adapter.tree.update({ parentSlug: config.slug, block, locale: locale })
			)
		);
	}

	return treeDiff;
};

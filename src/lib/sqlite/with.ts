import { asc, eq } from 'drizzle-orm';
import { rizom } from '$lib/index.js';
import type { Dic } from 'rizom/types/util';

type BuildWithParamArgs = {
	slug: string;
	locale?: string;
};

export const buildWithParam = ({ slug, locale }: BuildWithParamArgs): Dic => {
	const blocksTables = rizom.adapter.blocks.getBlocksTableNames(slug);
	const treeTables = rizom.adapter.tree.getBlocksTableNames(slug);
	const withParam: Dic = Object.fromEntries(
		[...blocksTables, ...treeTables].map((k) => [
			k,
			{ orderBy: [asc(rizom.adapter.tables[k].position)] }
		])
	);

	if (locale) {
		const localesTableName = `${slug}Locales`;
		if (localesTableName in rizom.adapter.tables) {
			const tableLocales = rizom.adapter.tables[localesTableName];
			withParam[localesTableName] = { where: eq(tableLocales.locale, locale) };
		}
		for (const blocksTable of blocksTables) {
			if (`${blocksTable}Locales` in rizom.adapter.tables) {
				withParam[blocksTable] = {
					...withParam[blocksTable],
					with: {
						[`${blocksTable}Locales`]: {
							where: eq(rizom.adapter.tables[`${blocksTable}Locales`].locale, locale)
						}
					}
				};
			}
		}
		for (const treeTable of treeTables) {
			if (`${treeTable}Locales` in rizom.adapter.tables) {
				withParam[treeTable] = {
					...withParam[treeTable],
					with: {
						[`${treeTable}Locales`]: {
							where: eq(rizom.adapter.tables[`${treeTable}Locales`].locale, locale)
						}
					}
				};
			}
		}
	}

	if (`${slug}Rels` in rizom.adapter.tables) {
		const tableNameRelationFields = `${slug}Rels`;
		const tableRelationFields = rizom.adapter.tables[tableNameRelationFields];
		withParam[tableNameRelationFields] = {
			orderBy: [asc(tableRelationFields.path), asc(tableRelationFields.position)]
		};
	}

	return withParam;
};

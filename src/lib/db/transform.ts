import { omit } from '../utils/object.js';
import { getTableColumns } from 'drizzle-orm';
import { unflatten } from 'flat';
import { toPascalCase } from '../utils/string.js';
import type { Relation } from './relations.js';
import deepmerge from 'deepmerge';
import { privateFieldNames } from 'rizom/collection/auth/privateFields.server.js';
import { isUploadConfig } from '../config/utils.js';
import { buildConfigMap } from '../operations/preprocess/config/map.js';
import { safeFlattenDoc } from '../utils/doc.js';
import { postprocessFields } from '../operations/postprocess/fields.server.js';
import type { CollectionSlug, GenericBlock, GenericDoc, PrototypeSlug } from 'rizom/types/doc.js';
import type { ConfigInterface } from 'rizom/config/index.server.js';
import type {
	AdapterBlocksInterface,
	TransformContext,
	TransformManyContext
} from 'rizom/types/adapter.js';
import type { Dic } from 'rizom/types/utility.js';
import { beforeRead } from 'rizom/operations/postprocess/beforeRead.server.js';

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type CreateTransformInterfaceArgs = {
	configInterface: ConfigInterface;
	tables: any;
	blocksInterface: AdapterBlocksInterface;
};
export type TransformInterface = ReturnType<typeof databaseTransformInterface>;

/////////////////////////////////////////////
// Interface
//////////////////////////////////////////////

export const databaseTransformInterface = ({
	configInterface,
	tables,
	blocksInterface
}: CreateTransformInterfaceArgs) => {
	const transformDocs = async <T extends GenericDoc = GenericDoc>({
		docs: rawDocs,
		slug,
		locale,
		api,
		event,
		depth = 0
	}: TransformManyContext<T>) => {
		const docs: GenericDoc[] = await Promise.all(
			rawDocs.map((doc) => transformDoc({ doc, slug, locale, event, api, depth }))
		);
		return docs as T[];
	};

	const transformDoc = async <T extends GenericDoc = GenericDoc>({
		doc,
		slug,
		locale,
		api,
		event,
		depth = 0
	}: TransformContext<Dic>) => {
		//
		const user = event.locals.user;
		const tableNameRelationFields = `${slug}Rels`;
		const tableNameLocales = `${slug}Locales`;
		const isLive = event.url.pathname.startsWith('/live');
		const isPanel = event.url.pathname.startsWith('/panel') || isLive;
		let docLocalAPI;
		if (configInterface.isCollection(slug)) {
			docLocalAPI = api.collection(slug);
		} else {
			docLocalAPI = api.area(slug);
		}
		const config = docLocalAPI.config;
		const blankDocument = docLocalAPI.blank();

		/** Add localized fields */
		if (locale && tableNameLocales in tables) {
			const localizedColumns = Object.keys(
				omit(['parentId', 'locale'], getTableColumns(tables[tableNameLocales as PrototypeSlug]))
			);

			const defaultLocalizedValues: Dic = {};
			for (const column of localizedColumns) {
				defaultLocalizedValues[column] = null;
			}

			doc = { ...defaultLocalizedValues, ...doc[tableNameLocales][0], ...doc };

			delete doc[tableNameLocales];
			delete doc.parentId;
		}

		let flatDoc: Dic = safeFlattenDoc(doc);

		/** Place relations */
		if (tableNameRelationFields in tables) {
			for (const relation of doc[tableNameRelationFields]) {
				/** Relation collection key ex: usersId */
				const relationToIdKey = Object.keys(relation).filter(
					(key) => key.endsWith('Id') && key !== 'parentId' && relation[key] !== null
				)[0] as PrototypeSlug;

				const relationToId = relation[relationToIdKey];
				const relationPath = relation.path;
				let relationOutput: Relation | GenericDoc | null;

				/** Get relation if depth > 0 */
				if (depth > 0) {
					const relationSlug = relationToIdKey.replace('Id', '') as CollectionSlug;
					relationOutput = await api
						.collection(relationSlug)
						.findById({ id: relationToId, locale: relation.locale, depth: depth - 1 });
				} else {
					/** Clean relation */
					for (const key of Object.keys(relation)) {
						/** Delete empty [table]Id */
						if (relation[key] === null) {
							delete relation[key];
						} else if (key.endsWith('Id') && key !== 'parentId') {
							relation.relationTo = key.replace('Id', '');
							relation.relationId = relation[key];
							delete relation[key];
						}
					}
					if (!isPanel) {
						delete relation.position;
						delete relation.parentId;
						delete relation.path;
					}
					relationOutput = relation;
				}

				/** Assign relation */
				if (!relation.locale) {
					flatDoc[relationPath] = [...(flatDoc[relationPath] || []), relationOutput];
				} else if (relation.locale === locale) {
					flatDoc[relationPath] = [...(flatDoc[relationPath] || []), relationOutput];
				}
			}
			// delete doc[tableNameRelationFields];
		}

		/** Extract all blocks  */
		const blocksTables = blocksInterface.getBlocksTableNames(slug);
		const blocks: Dic[] = [].concat(...blocksTables.map((blockTable) => doc[blockTable]));

		/** Place each block in its path */
		for (let block of blocks) {
			if (!(block.path in flatDoc)) {
				flatDoc[block.path] = [];
			}
			const blockLocaleTableName = `${slug}Blocks${toPascalCase(block.type)}Locales`;
			if (locale && blockLocaleTableName in tables) {
				block = {
					...((block[blockLocaleTableName][0] as Partial<GenericBlock>) || {}),
					...block
				};
			}
			/** Clean */
			const { position, path } = block;
			if (!isPanel) {
				delete block.position;
				delete block.path;
				delete block.parentId;
				delete block.locale;
			}
			delete block[blockLocaleTableName];
			/** Assign */
			flatDoc[path][position] = block;
		}

		let output: Dic = unflatten(flatDoc);

		/** Remove blocks table keys */
		const keysToDelete: string[] = blocksTables;
		if (tableNameRelationFields in output) {
			keysToDelete.push(tableNameRelationFields);
		}

		output = omit(keysToDelete, deepmerge(blankDocument, output));

		return (await beforeRead({
			doc: output,
			config,
			user,
			event,
			isPanel,
			locale
		})) as T;
	};

	return {
		doc: transformDoc,
		docs: transformDocs
	};
};

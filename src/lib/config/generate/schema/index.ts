import buildRootTable from './root.js';
import write from './write.js';
import { toSnakeCase } from '$lib/utils/string.js';

import {
	templateAuth,
	templateExportRelationsFieldsToTable,
	templateExportTables,
	templateHead
} from './templates.js';
import type { BuiltConfig } from 'rizom/types/config.js';
import type { Dic } from 'rizom/types/utility.js';
import { generateJunctionTableDefinition } from './relations/junction.js';
import { generateRelationshipDefinitions } from './relations/definition.js';
import dedent from 'dedent';

export function generateSchemaString(config: BuiltConfig): string {
	const schema: string[] = [];
	let enumTables: string[] = [];
	let enumRelations: string[] = [];
	let relationFieldsExportDic: Dic = {};

	for (const collection of config.collections) {
		const collectionSlug = toSnakeCase(collection.slug);

		const {
			schema: collectionSchema,
			relationsDic,
			relationFieldsMap,
			relationFieldsHasLocale
		} = buildRootTable({
			fields: collection.fields,
			rootName: collectionSlug,
			locales: config.localization?.locales || [],
			hasAuth: !!collection.auth,
			tableName: collectionSlug,
			blueprints: config.blueprints
		});

		const { junctionTable, junctionTableName } = generateJunctionTableDefinition({
			tableName: collectionSlug,
			relationFieldsMap,
			hasLocale: relationFieldsHasLocale
		});

		if (junctionTable.length) {
			relationsDic[collectionSlug] ??= [];
			relationsDic[collectionSlug].push(junctionTableName);
		}

		const { relationsDefinitions, relationsNames } = generateRelationshipDefinitions({
			relationsDic
		});

		const relationsTableNames = Object.values(relationsDic).flat();

		enumTables = [...enumTables, collectionSlug, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[collectionSlug]: relationFieldsMap
		};

		schema.push(
			templateHead(collection.slug),
			collectionSchema,
			junctionTable,
			relationsDefinitions
		);
	}

	/**
	 * Globals
	 */
	for (const global of config.globals) {
		const globalSlug = toSnakeCase(global.slug);

		const {
			schema: globalSchema,
			relationsDic,
			relationFieldsMap,
			relationFieldsHasLocale
		} = buildRootTable({
			fields: global.fields,
			rootName: globalSlug,
			locales: config.localization?.locales || [],
			tableName: globalSlug,
			blueprints: config.blueprints
		});

		const { junctionTable, junctionTableName } = generateJunctionTableDefinition({
			tableName: globalSlug,
			relationFieldsMap,
			hasLocale: relationFieldsHasLocale
		});

		if (junctionTable.length) {
			relationsDic[globalSlug] ??= [];
			relationsDic[globalSlug].push(junctionTableName);
		}

		const { relationsDefinitions, relationsNames } = generateRelationshipDefinitions({
			relationsDic
		});

		const relationsTableNames = Object.values(relationsDic).flat();

		enumTables = [...enumTables, globalSlug, ...relationsTableNames];
		enumRelations = [...enumRelations, ...relationsNames];
		relationFieldsExportDic = {
			...relationFieldsExportDic,
			[globalSlug]: relationFieldsMap
		};

		schema.push(templateHead(global.slug), globalSchema, junctionTable, relationsDefinitions);
	}

	schema.push(templateHead('Auth'), templateAuth);
	schema.push(templateExportTables([...enumTables, 'authUsers', 'sessions']));
	schema.push(templateExportRelationsFieldsToTable(relationFieldsExportDic));

	schema.push(dedent`
    const schema = {
      ${enumTables.join(',\n      ')},
      ${enumRelations.length ? enumRelations.join(',\n      ') + ',' : ''}
      authUsers,
      sessions
  }

  export type Schema = typeof schema
  export default schema
  `);

	return schema.join('\n').replace(/\n{3,}/g, '\n\n');
}

const generateSchema = (config: BuiltConfig) => {
	write(generateSchemaString(config));
};

export default generateSchema;

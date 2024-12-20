import type { AnyField, AnyFormField } from 'rizom/types/fields.js';
import {
	isBlocksField,
	isFormField,
	isGroupField,
	isRelationField,
	isTabsField
} from 'rizom/utils/field.js';
import { toPascalCase } from '$lib/utils/string.js';
import { templateHasAuth, templateLocale, templateParent, templateTable } from './templates.js';
import type { LocaleConfig } from 'rizom/types/config.js';
import type { RelationFieldsMap } from './relations/definition.js';
import type { FieldBluePrint } from 'rizom/types/fields';
const p = toPascalCase;

type Args = {
	fields: AnyField[];
	tableName: string;
	rootName: string;
	locales?: LocaleConfig[];
	hasParent?: boolean;
	relationFieldsMap?: RelationFieldsMap;
	relationsDic?: Record<string, string[]>;
	hasAuth?: boolean;
	blueprints: Record<string, FieldBluePrint>;
};

type Return = {
	schema: string;
	relationFieldsMap: RelationFieldsMap;
	relationsDic: Record<string, string[]>;
	relationFieldsHasLocale: boolean;
};

function hasLocalizedField(fields: AnyField[]): boolean {
	// Iterate through each field in the array
	for (const field of fields) {
		// Case 1: If it's a group field, check all fields within the group
		if (isGroupField(field)) {
			if (hasLocalizedField(field.fields)) {
				return true;
			}
		}

		// Case 2: If it's a tabs field, check all fields within each tab
		else if (isTabsField(field)) {
			for (const tab of field.tabs) {
				if (hasLocalizedField(tab.fields)) {
					return true;
				}
			}
		}

		// Case 3: If it's a blocks field, check all fields within each block
		else if (isBlocksField(field)) {
			for (const block of field.blocks) {
				if (hasLocalizedField(block.fields)) {
					return true;
				}
			}
		}

		// Case 4: For regular form fields, check if it's marked as localized
		else if (isFormField(field) && field.localized) {
			return true;
		}
	}

	// If no localized fields were found, return false
	return false;
}

const buildRootTable = ({
	fields: incomingFields,
	tableName,
	rootName,
	hasParent,
	locales,
	relationFieldsMap = {},
	relationsDic = {},
	hasAuth,
	blueprints
}: Args): Return => {
	const registeredBlocks: string[] = [];
	const blocksTables: string[] = [];
	let relationFieldsHasLocale = false;

	const generateFieldsTemplates = (fields: AnyField[], withLocalized?: boolean): string[] => {
		/** All key/pair, rizom field / drizzle schema string  */
		let templates: string[] = [];

		const checkLocalized = (config: AnyFormField) => {
			return (
				(withLocalized && config.localized) ||
				(!withLocalized && !config.localized) ||
				withLocalized === undefined
			);
		};

		for (const field of fields) {
			if (isGroupField(field)) {
				templates = [...templates, ...generateFieldsTemplates(field.fields, withLocalized)];
			} else if (isTabsField(field)) {
				for (const tab of field.tabs) {
					templates = [...templates, ...generateFieldsTemplates(tab.fields, withLocalized)];
				}
			} else if (isRelationField(field)) {
				if (field.localized) {
					relationFieldsHasLocale = true;
				}
				relationFieldsMap = {
					...relationFieldsMap,
					[field.name]: {
						to: field.relationTo,
						localized: field.localized
					}
				};
			} else if (isBlocksField(field)) {
				for (const block of field.blocks) {
					const blockTableName = `${rootName}Blocks${p(block.name)}`;
					if (!registeredBlocks.includes(blockTableName)) {
						relationsDic = {
							...relationsDic,
							[rootName]: [...(relationsDic[rootName] || []), blockTableName]
						};
						const {
							schema: blockTable,
							relationsDic: nestedRelationsDic,
							relationFieldsMap: nestedRelationFieldsDic
						} = buildRootTable({
							fields: block.fields,
							tableName: blockTableName,
							hasParent: true,
							relationsDic,
							relationFieldsMap,
							locales,
							rootName,
							blueprints
						});
						relationsDic = nestedRelationsDic;
						relationFieldsMap = nestedRelationFieldsDic;
						registeredBlocks.push(blockTableName);
						blocksTables.push(blockTable);
					}
				}
			} else if (field.type in blueprints && 'name' in field) {
				const blueprint = blueprints[field.type];
				if (checkLocalized(field) && blueprint.toSchema) {
					templates.push(blueprint.toSchema(field) + ',');
				}
			}
		}
		return templates;
	};

	let table: string;

	if (locales && locales.length && hasLocalizedField(incomingFields)) {
		const tableNameLocales = `${tableName}Locales`;
		const strLocalizedFields = generateFieldsTemplates(incomingFields, true);
		relationsDic[tableName] = [...(relationsDic[tableName] || []), tableNameLocales];
		const strUnlocalizedFields = generateFieldsTemplates(incomingFields, false);
		if (hasParent) {
			strUnlocalizedFields.push(templateParent(rootName));
		}
		if (hasAuth) {
			strUnlocalizedFields.push(templateHasAuth);
		}
		table = templateTable(tableName, strUnlocalizedFields.join('\n  '));
		table += templateTable(
			tableNameLocales,
			[...strLocalizedFields, templateLocale(), templateParent(tableName)].join('\n  ')
		);
	} else {
		const strFields = generateFieldsTemplates(incomingFields);
		if (hasParent) {
			strFields.push(templateParent(rootName));
		}
		if (hasAuth) {
			strFields.push(templateHasAuth);
		}
		table = templateTable(tableName, strFields.join('\n  '));
	}

	return {
		schema: [table, ...blocksTables].join('\n\n'),
		relationFieldsMap,
		relationFieldsHasLocale,
		relationsDic
	};
};

export default buildRootTable;

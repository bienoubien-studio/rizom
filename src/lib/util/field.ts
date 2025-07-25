import type { GenericBlock } from '$lib/core/types/doc.js';
import type { BlocksFieldRaw } from '$lib/fields/blocks/index.js';
import type { GroupFieldRaw } from '$lib/fields/group/index.js';
import type { TabsFieldRaw } from '$lib/fields/tabs/index.js';
import type { TreeFieldRaw } from '$lib/fields/tree/index.js';
import type {
	BlocksField,
	ComponentField,
	DateField,
	Field,
	FormField,
	GroupField,
	RelationField,
	SelectField,
	SeparatorField,
	TabsField
} from '$lib/fields/types.js';
import type { Dic } from '$lib/util/types.js';
import type { JSONContent } from '@tiptap/core';
import type { Relation } from '../adapter-sqlite/relations.js';
import { hasProps, isObjectLiteral } from './object.js';

/**
 * Checks if a field is a presentative field (currently only separator fields).
 * Presentative fields are used for UI organization and don't store data.
 */
export const isPresentative = (field: Field): field is SeparatorField => ['separator'].includes(field.type);

/**
 * Checks if a field is a form field (has a name property).
 * Form fields are fields that can store data in documents.
 */
export const isFormField = (field: Field): field is FormField => 'name' in field;

/**
 * Checks if a form field is not hidden.
 */
export const isNotHidden = (field: FormField) => !field.hidden;

/**
 * Checks if a field has live updates enabled.
 */
export const isLiveField = (field: Field) => field.live;

/**
 * Checks if a field is a component field.
 */
export const isComponentField = (field: Field): field is ComponentField => field.type === 'component';

/**
 * Checks if a field is a blocks field.
 */
export const isBlocksField = (field: Field): field is BlocksField => field.type === 'blocks';

/**
 * Checks if a field is a blocks field (raw type).
 */
export const isBlocksFieldRaw = (field: Field): field is BlocksFieldRaw => field.type === 'blocks';

/**
 * Checks if a field is a tree field.
 */
export const isTreeFieldRaw = (field: Field): field is TreeFieldRaw => field.type === 'tree';

/**
 * Checks if a field is a select field.
 */
export const isSelectField = (field: Field): field is SelectField => field.type === 'select';

/**
 * Checks if a field is a group field.
 */
export const isGroupField = (field: Field): field is GroupField => field.type === 'group';

/**
 * Checks if a field is a group field (raw type).
 */
export const isGroupFieldRaw = (field: Field): field is GroupFieldRaw => field.type === 'group';

/**
 * Checks if a field is a tabs field.
 *
 * @param field - The field to check
 * @returns True if the field is a tabs field
 */
export const isTabsField = (field: Field): field is TabsField => field.type === 'tabs';

/**
 * Checks if a field is a tabs field (raw type).
 *
 * @param field - The field to check
 * @returns True if the field is a tabs field
 */
export const isTabsFieldRaw = (field: Field): field is TabsFieldRaw => field.type === 'tabs';

/**
 * Checks if a field is a date field.
 */
export const isDateField = (field: Field): field is DateField => field.type === 'date';

/**
 * Checks if a field is a relation field.
 */
export const isRelationField = (field: Field): field is RelationField => field.type === 'relation';

/**
 * Checks if a field is a roles field (select field with name 'roles').
 * Used for user role management.
 */
export const isRolesField = (field: Field): field is SelectField =>
	isFormField(field) && isSelectField(field) && field.name === 'roles';

/**
 * Checks if a relation value is resolved (contains the actual referenced document).
 *
 * @param value - A RelationValue to check
 * @returns True if the value is a resolved relation
 *
 * @example
 * // Returns true for a resolved relation
 * isRelationResolved({ title: 'Home Page', _prototype: 'collection', _type: 'pages' });
 */
export const isRelationResolved = <T>(value: any): value is T => {
	return value && isObjectLiteral(value) && hasProps(['title', '_prototype', '_type'], value);
};

/**
 * Checks if a relation value is unresolved (contains only reference information).
 *
 * @param value - The value to check
 * @returns True if the value is an unresolved relation
 *
 * @example
 * // Returns true for an unresolved relation
 * isRelationUnresolved({ relationTo: 'pages', documentId: '123' });
 */
export const isRelationUnresolved = (value: any): value is Omit<Relation, 'path' | 'position' | 'ownerId'> => {
	return value && isObjectLiteral(value) && hasProps(['relationTo', 'documentId'], value);
};

/**
 * Resolves a relation by fetching the referenced document.
 * If the relation is already resolved, returns it as is.
 *
 * @param value - The relation value to resolve
 * @returns A promise that resolves to the referenced document
 *
 * @example
 * // Resolves a relation to its full document
 * const page = await resolveRelation({ relationTo: 'pages', documentId: '123' });
 */
export const resolveRelation = async <T>(value: any): Promise<T> => {
	if (isRelationResolved<T>(value)) {
		return value;
	}
	return (await fetch(`api/${value.relationTo}/${value.documentId}`)
		.then((r) => r.json())
		.then((r) => r.doc)) as T;
};

/**
 * Converts rich text JSON content to plain text.
 * Extracts text content from a TipTap/ProseMirror JSON structure.
 *
 * @param value - The rich text JSON string
 * @returns Plain text extracted from the rich text content
 *
 * @example
 * // Returns "Hello world"
 * richTextJSONToText('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello world"}]}]}');
 */
export const richTextJSONToText = (value: string | JSONContent): string => {
	if (!value) return '';
	let textValue: string;
	const renderNodes = (nodes: { [k: string]: any }) => {
		return nodes
			.map((node: { text?: string; [k: string]: any }) => {
				if ('text' in node) {
					return node.text;
				} else if ('content' in node) {
					return renderNodes(node.content);
				}
			})
			.join(' ');
	};

	try {
		const jsonContent = typeof value === 'string' ? JSON.parse(value) : value;
		textValue = renderNodes(jsonContent.content);
	} catch (err) {
		console.error(err);
		textValue = JSON.stringify(value);
	}
	return textValue;
};

/**
 * Flattens a nested field structure into an array of form fields.
 * Handles special field types like tabs, tree, and blocks.
 *
 * @param prev - The accumulator array of form fields
 * @param curr - The current field to process
 * @returns An array of flattened form fields
 *
 * @example
 * // Flattens a tabs field into its constituent form fields
 * const fields = [tabsField].reduce(toFormFields, []);
 */
export function toFormFields(prev: any[], curr: any) {
	if (curr.type === 'tabs') {
		return curr.tabs.reduce(toFormFields, prev);
	} else if (curr.type === 'tree') {
		curr = {
			...curr,
			fields: curr.fields.reduce(toFormFields, [])
		};
	} else if (curr.type === 'blocks') {
		curr = {
			...curr,
			blocks: curr.blocks.map((b: GenericBlock) => ({
				...b,
				fields: b.fields.reduce(toFormFields, [])
			}))
		};
	} else if ('fields' in curr) {
		return curr.fields.reduce(toFormFields, prev);
	}
	prev.push(curr);
	return prev;
}

/**
 * Creates an object with empty values based on field configurations.
 * Uses defaultValue if specified, otherwise undefined.
 *
 * @param arr - Array of form field configurations
 * @returns An object with field names as keys and empty/default values
 *
 * @example
 * // Returns { title: '', description: null }
 * emptyValuesFromFieldConfig([
 *   { name: 'title', type: 'text', defaultValue: '' },
 *   { name: 'description', type: 'text', defaultValue: null }
 * ]);
 */
export const emptyValuesFromFieldConfig = <T extends FormField>(arr: T[]): Dic => {
	return Object.assign(
		{},
		...arr.map((config) => {
			let emptyValue;
			if ('defaultValue' in config) {
				if (typeof config.defaultValue === 'function') {
					emptyValue = config.defaultValue();
				} else {
					emptyValue = config.defaultValue;
				}
			}
			return {
				[config.name]: emptyValue
			};
		})
	);
};

/**
 * Remove block type in path
 * @example
 * normalizePath('foo.bar.0:content.baz')
 * 
 * // return foo.bar.0.baz
 */
export const normalizeFieldPath = (path:string) => {
	const regExpBlockType = /:[a-zA-Z0-9]+/g
	return path.replace(regExpBlockType, '')
}
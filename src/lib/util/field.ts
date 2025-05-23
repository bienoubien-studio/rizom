import type { GenericBlock } from '$lib/core/types/doc.js';
import type { Relation } from '../adapter-sqlite/relations.js';
import { hasProps, isObjectLiteral } from './object.js';
import type {
	BlocksField,
	ComponentField,
	DateField,
	GroupField,
	RelationField,
	SelectField,
	SeparatorField,
	TabsField,
} from '$lib/fields/types.js';
import type { Dic } from '$lib/util/types.js';
import type { FormField, Field } from '$lib/fields/types.js';
import type { BlocksFieldRaw } from '$lib/fields/blocks/index.js';
import type { GroupFieldRaw } from '$lib/fields/group/index.js';
import type { TabsFieldRaw } from '$lib/fields/tabs/index.js';
import type { TreeFieldRaw } from '$lib/fields/tree/index.js';

export const isPresentative = (field: Field): field is SeparatorField =>
	['separator'].includes(field.type);

export const isFormField = (field: Field): field is FormField => 'name' in field;
export const isNotHidden = (field: FormField) => !field.hidden;
export const isLiveField = (field: Field) => field.live;
export const isComponentField = (field: Field): field is ComponentField =>
	field.type === 'component';
export const isBlocksField = (field: Field): field is BlocksField => field.type === 'blocks';
export const isBlocksFieldRaw = (field: Field): field is BlocksFieldRaw => field.type === 'blocks';
export const isTreeFieldRaw = (field: Field): field is TreeFieldRaw => field.type === 'tree';
export const isSelectField = (field: Field): field is SelectField => field.type === 'select';
export const isGroupField = (field: Field): field is GroupField => field.type === 'group';
export const isGroupFieldRaw = (field: Field): field is GroupFieldRaw => field.type === 'group';
export const isTabsField = (field: Field): field is TabsField => field.type === 'tabs';
export const isTabsFieldRaw = (field: Field): field is TabsFieldRaw => field.type === 'tabs';
export const isDateField = (field: Field): field is DateField => field.type === 'date';
export const isRelationField = (field: Field): field is RelationField => field.type === 'relation';
export const isRolesField = (field: Field): field is SelectField =>
	isFormField(field) && isSelectField(field) && field.name === 'roles';

export const isRelationResolved = <T>(value: any): value is T => {
	return value && isObjectLiteral(value) && hasProps(['title', '_prototype', '_type'], value);
};

export const isRelationUnresolved = (
	value: any
): value is Omit<Relation, 'path' | 'position' | 'ownerId'> => {
	return value && isObjectLiteral(value) && hasProps(['relationTo', 'documentId'], value);
};

export const resolveRelation = async <T>(value: any): Promise<T> => {
	if (isRelationResolved<T>(value)) {
		return value;
	}
	return (await fetch(`api/${value.relationTo}/${value.documentId}`)
		.then((r) => r.json())
		.then((r) => r.doc)) as T;
};

export const richTextJSONToText = (value: string): string => {
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
		const doc = JSON.parse(value);
		textValue = renderNodes(doc.content);
	} catch {
		textValue = value;
	}
	return textValue;
};

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

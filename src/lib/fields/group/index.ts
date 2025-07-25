import type { Field, FormField } from '$lib/fields/types.js';
import { FieldBuilder, FormFieldBuilder } from '../builders/index.js';
import Group from './component/Group.svelte';

const isEmpty = (value: unknown) =>
	!!value === false ||
	(typeof value === 'object' &&
		value !== null &&
		!Array.isArray(value) &&
		Object.getPrototypeOf(value) === Object.prototype &&
		Object.keys(value).length === 0);

export class GroupFieldBuilder extends FormFieldBuilder<GroupField> {
	//
	constructor(name: string) {
		super(name, 'group');
		this.field.isEmpty = isEmpty;
	}

	get component() {
		return Group;
	}

	label(label: string) {
		this.field.label = label;
		return this;
	}

	fields(...fields: FieldBuilder<Field>[]) {
		this.field.fields = fields;
		return this;
	}

	_toType() {
		const fieldsTypes = this.field.fields
			.filter((field) => field instanceof FormFieldBuilder)
			.map((field) => field._toType())
			.join(',\n\t');
		return `${this.field.name}: {${fieldsTypes}}`;
	}

	compile() {
		return { ...this.field, fields: this.field.fields.map((f) => f.compile()) };
	}
}

export const group = (name: string) => new GroupFieldBuilder(name);

/****************************************************/
/* Types
/****************************************************/

export type GroupField = FormField & {
	type: 'group';
	name: string;
	label?: string;
	fields: FieldBuilder<Field>[];
};

export type GroupFieldRaw = FormField & {
	type: 'group';
	name: string;
	label?: string;
	fields: Field[];
};

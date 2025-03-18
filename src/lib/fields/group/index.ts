import type { Field, FormField } from 'rizom/types/fields';
import { FieldBuilder, FormFieldBuilder } from '../builders/index.js';
import { isObjectLiteral } from 'rizom/util/object.js';
import { toPascalCase } from 'rizom/util/string.js';
import { isFormField } from 'rizom/util/field.js';

const isEmpty = (value: unknown) =>
	!!value === false || (isObjectLiteral(value) && Object.keys(value).length === 0);

export class GroupFieldBuilder extends FormFieldBuilder<GroupField> {
	//
	constructor(name: string) {
		super(name, 'group');
		this.field.isEmpty = isEmpty;
	}

	label(label: string) {
		this.field.label = label;
		return this;
	}
	fields(...fields: FieldBuilder<Field>[]) {
		this.field.fields = fields;
		return this;
	}
	compile() {
		return { ...this.field, fields: this.field.fields.map((f) => f.compile()) };
	}
}

export const group = (name: string) => new GroupFieldBuilder(name);

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

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

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		group: any;
	}
	interface RegisterFields {
		GroupField: GroupField;
	}
}

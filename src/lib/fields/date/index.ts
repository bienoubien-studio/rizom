import type { FormField } from 'rizom/types';
import { FormFieldBuilder } from '../_builders/index.js';
import { templateUniqueRequired } from 'rizom/config/generate/schema/templates';
import toSnakeCase from 'to-snake-case';
import type { AnyField } from 'rizom/types';
import Component from './component/Date.svelte';
import Cell from './component/Cell.svelte';

export const blueprint = {
	component: Component,
	cell: Cell,
	toSchema(field: DateField) {
		const { name } = field;
		const snake_name = toSnakeCase(name);
		const suffix = templateUniqueRequired(field);
		return `${name}: integer('${snake_name}', { mode : 'timestamp' })${suffix}`;
	},
	toType: (field: DateField) => `${field.name}${!field.required ? '?' : ''}: Date`,
	match: (field: AnyField): field is DateField => field.type === 'date'
};

export const date = (name: string) => new DateFieldBuilder(name);

const stringToDate = (value: string) => {
	return new Date(value);
};

class DateFieldBuilder extends FormFieldBuilder<DateField> {
	//
	constructor(name: string) {
		super(name, 'date');
		this.field.hooks = {
			beforeValidate: [stringToDate],
			beforeSave: [],
			beforeRead: []
		};
	}

	defaultValue(value: Date) {
		this.field.defaultValue = value;
		return this;
	}
	isTitle() {
		this.field.isTitle = true;
		return this;
	}
	toField(): DateField {
		if (!this.field.defaultValue) {
			this.field.defaultValue = () => {
				const date = new Date();
				date.setHours(0, 0, 0, 0);
				return date;
			};
		}

		return super.toField();
	}
}

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type DateField = FormField & {
	type: 'date';
	defaultValue?: Date | (() => Date);
	unique?: boolean;
	isTitle?: true;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		date: any;
	}
	interface RegisterFormFields {
		DateField: DateField; // register the field type
	}
}

import type { DefaultValueFn, FormField } from '$lib/fields/types.js';
import { FormFieldBuilder } from '../builders/index.js';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import DateComponent from './component/Date.svelte';
import Cell from './component/Cell.svelte';

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

	get component() {
		return DateComponent;
	}

	get cell() {
		return Cell;
	}

	_toType() {
		return `${this.field.name}${!this.field.required ? '?' : ''}: Date`;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: integer('${snake}', { mode : 'timestamp_ms' })${suffix}`;
	}

	defaultValue(value: Date | DefaultValueFn<Date>) {
		this.field.defaultValue = value;
		return this;
	}
	
	isTitle() {
		this.field.isTitle = true;
		return this;
	}

	compile(): DateField {
		if (!this.field.defaultValue) {
			this.field.defaultValue = () => {
				const date = new Date();
				date.setHours(0, 0, 0, 0);
				return date;
			};
		}

		return super.compile();
	}
}

/****************************************************/
/* Type
/****************************************************/
export type DateField = FormField & {
	type: 'date';
	defaultValue?: Date | DefaultValueFn<Date>;
	unique?: boolean;
	isTitle?: true;
};

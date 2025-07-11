import type { DefaultValueFn, FormField } from '$lib/fields/types.js';
import { FormFieldBuilder } from '../builders/index.js';
import validate from '$lib/util/validate';
import { templateUniqueRequired } from '$lib/core/dev/generate/schema/templates.server.js';
import EmailComp from './component/Email.svelte';

class EmailFieldBuilder extends FormFieldBuilder<EmailField> {
	constructor(name: string) {
		super(name, 'email');
		this.field.validate = validate.email;
	}

	layout(layout: 'compact' | 'default') {
		this.field.layout = layout;
		return this;
	}
	
	get component() {
		return EmailComp;
	}
	
	_toType() {
		return `${this.field.name}${!this.field.required ? '?' : ''}: string`;
	}

	_toSchema(parentPath?: string) {
		const { camel, snake } = this._getSchemaName(parentPath);
		const suffix = templateUniqueRequired(this.field);
		if(this._generateSchema) return this._generateSchema({ camel, snake, suffix })
		return `${camel}: text('${snake}')${suffix}`;
	}

	unique(bool?:boolean) {
		this.field.unique = typeof bool === 'boolean' ? bool : true;
		return this;
	}
	defaultValue(value: string | DefaultValueFn<string>) {
		this.field.defaultValue = value;
		return this;
	}
	isTitle() {
		this.field.isTitle = true;
		return this;
	}
}

export const email = (name: string) => new EmailFieldBuilder(name);

/****************************************************/
/* Type
/****************************************************/
export type EmailField = FormField & {
	type: 'email';
	defaultValue?: string | DefaultValueFn<string>;
	layout?: 'compact' | 'default';
	unique?: boolean;
	isTitle?: true;
};

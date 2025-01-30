import type { FormField } from 'rizom/types';
import toSnakeCase from 'to-snake-case';
import { BooleanFieldBuilder } from '../_builders/boolean.js';
import Toggle from './component/Toggle.svelte';
import Cell from './component/Cell.svelte';

class ToggleFieldBuilder extends BooleanFieldBuilder<ToggleField> {
	get component() {
		return Toggle;
	}
	get cell() {
		return Cell;
	}

	toSchema() {
		const { name } = this.field;
		const snake_name = toSnakeCase(name);
		return `${name}: integer('${snake_name}', { mode : 'boolean' })`;
	}

	toType() {
		return `${this.field.name}: boolean`;
	}

	defaultValue(value: boolean) {
		this.field.defaultValue = value;
		return this;
	}

	toField() {
		if (!this.field.validate) {
			this.field.validate = (value: any) => {
				return typeof value === 'boolean' || 'Should be a boolean';
			};
		}
		return super.toField();
	}
}

export const toggle = (name: string) => new ToggleFieldBuilder(name, 'toggle');

/////////////////////////////////////////////
// Type
//////////////////////////////////////////////
export type ToggleField = FormField & {
	type: 'toggle';
	defaultValue?: boolean;
};

/////////////////////////////////////////////
// Register
//////////////////////////////////////////////
declare module 'rizom' {
	interface RegisterFieldsType {
		toggle: any;
	}
	interface RegisterFormFields {
		ToggleField: ToggleField; // register the field type
	}
}

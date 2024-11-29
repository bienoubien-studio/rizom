import type { Plugin } from 'rizom/types/plugin';
import type { AnyFormField } from 'rizom/types';
import ColorPicker from './ColorPicker.svelte';
import toSnakeCase from 'to-snake-case';
import { FormFieldBuilder } from 'rizom/config/fields';
import type { ColorPickerField } from './types';

/////////////////////////////////////////////
// Plugin declaration
//////////////////////////////////////////////
export const colorPicker: Plugin = () => {
	return {
		name: 'color-picker',
		fields: [
			{
				type: 'color-picker',
				component: ColorPicker,
				templates: {
					schema: (field: AnyFormField) => `${field.name}: text('${toSnakeCase(field.name)}')`,
					type: (field: AnyFormField) => `${field.name}: string')`
				}
			}
		]
	};
};

/////////////////////////////////////////////
// Field Builder
//////////////////////////////////////////////
class ColorPickerFieldBuilder extends FormFieldBuilder<ColorPickerField> {
	//
	unique() {
		this.field.unique = true;
		return this;
	}
	defaultValue(value: string) {
		this.field.defaultValue = value;
		return this;
	}
}

// Wrapper function for ease of use
export const field = (name: string) => new ColorPickerFieldBuilder(name, 'color-picker');

/////////////////////////////////////////////
// Types
//////////////////////////////////////////////

declare module 'rizom' {
	interface Register {
		FieldsType: 'color-picker';
		AnyFormField: ColorPickerField;
	}
}

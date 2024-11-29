import type { FormField } from 'rizom/types';

export type ColorPickerField = FormField & {
	unique: boolean;
	defaultValue?: string;
};

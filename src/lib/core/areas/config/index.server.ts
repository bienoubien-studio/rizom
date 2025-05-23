import type { BuiltArea, Area } from '$lib/core/config/types/index.js';
import { findTitleField } from '../../config/build/fields/findTitle.js';

export const buildArea = (area: Area<any>): BuiltArea => {
	const fieldTitle = findTitleField(area.fields);

	return {
		...area,
		asTitle: fieldTitle ? fieldTitle.path : 'id',
		type: 'area'
	} as BuiltArea;
};

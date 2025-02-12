import type { FieldBuilder } from 'rizom/fields/_builders';
import { BlocksBuilder } from 'rizom/fields/blocks';
import type { AnyField } from 'rizom/types';
import { hasMaybeTitle, isGroupField, isTabsField } from 'rizom/utils/field';

export function findTitleField(fields: FieldBuilder<AnyField>[]): any | null {
	for (const field of fields) {
		// Direct check for isTitle
		if (hasMaybeTitle(field.raw) && 'isTitle' in field.raw && field.raw.isTitle === true) {
			return field;
		}

		// Check in group
		if (isGroupField(field.raw) && field.raw.fields) {
			const found = findTitleField(field.raw.fields);
			if (found) return found;
		}

		// Check in tabs
		if (isTabsField(field.raw) && field.raw.tabs) {
			for (const tab of field.raw.tabs) {
				if (tab.fields) {
					const found = findTitleField(tab.fields);
					if (found) return found;
				}
			}
		}
	}

	return null;
}

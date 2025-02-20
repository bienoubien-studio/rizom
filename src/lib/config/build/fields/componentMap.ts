import type { FieldBuilder } from 'rizom/fields/builders';
import { BlocksBuilder } from 'rizom/fields/blocks/index.js';
import type { Field } from 'rizom/types';
import { isGroupField, isTabsField } from 'rizom/utils/field.js';
import type { FieldsComponents } from 'rizom/types/panel';
import Email from 'rizom/fields/email/component/Email.svelte';
import Text from 'rizom/fields/email/component/Email.svelte';
import { GroupFieldBuilder } from 'rizom/fields/group';

export function buildComponentsMap(
	fields: FieldBuilder<Field>[]
): Record<string, FieldsComponents> {
	// Add Text and Email by default as needed for Login/Init forms
	const componentsMap: Record<string, FieldsComponents> = {
		email: { component: Email },
		text: { component: Text }
	};

	function addToMap(field: FieldBuilder<Field>) {
		if (field.component) {
			componentsMap[field.type] = {
				component: field.component,
				cell: field.cell
			};
		}
	}

	for (const field of fields) {
		// Add current field if it has component
		addToMap(field);

		// Check in blocks
		if (field instanceof BlocksBuilder && field.raw.blocks) {
			for (const block of field.raw.blocks) {
				if (block.fields) {
					Object.assign(componentsMap, buildComponentsMap(block.fields));
				}
			}
		}

		// Check in group
		if (field instanceof GroupFieldBuilder && field.raw.fields) {
			Object.assign(componentsMap, buildComponentsMap(field.raw.fields));
		}

		// Check in tabs
		if (isTabsField(field.raw) && field.raw.tabs) {
			for (const tab of field.raw.tabs) {
				if (tab.fields) {
					Object.assign(componentsMap, buildComponentsMap(tab.fields));
				}
			}
		}
	}

	return componentsMap;
}

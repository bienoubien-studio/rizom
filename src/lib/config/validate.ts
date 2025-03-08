import {
	isBlocksFieldRaw,
	isFormField,
	isGroupFieldRaw,
	isTabsFieldRaw,
	toFormFields
} from '../util/field';
import { isAuthConfig, isUploadConfig } from './util';
import type { CompiledCollection, CompiledArea, CompiledConfig } from 'rizom/types/config';
import type { FormField, PrototypeSlug } from 'rizom/types';
import cache from 'rizom/bin/generate/cache';
import type { BlocksFieldRaw } from 'rizom/fields/blocks';
import { isCamelCase } from 'rizom/util/string';

function hasDuplicates(arr: string[]): string[] {
	return [...new Set(arr.filter((e, i, a) => a.indexOf(e) !== i))];
}

function hasDuplicateSlug(config: CompiledConfig) {
	const slugs: PrototypeSlug[] = [];
	for (const collection of config.collections) {
		slugs.push(collection.slug);
	}
	for (const area of config.areas) {
		slugs.push(area.slug);
	}

	const duplicates = hasDuplicates(slugs);
	if (duplicates.length) {
		return ['Duplicated collection/area slugs :' + duplicates.join(', ')];
	}
	return [];
}

function hasUsersSlug(config: CompiledConfig) {
	const invalid = config.collections.filter((collection) => collection.slug === 'users').length > 1;
	if (invalid) {
		return ['"users" is a reserved slug for panel users'];
	}
	return [];
}

const validateFields = (config: CompiledConfig) => {
	let errors: string[] = [];
	for (const collection of config.collections) {
		const collectionErrors = validateDocumentFields(collection);
		errors = [...errors, ...collectionErrors];
	}
	for (const area of config.areas) {
		const collectionErrors = validateDocumentFields(area);
		errors = [...errors, ...collectionErrors];
	}
	return errors;
};

type UnknownConfig = CompiledCollection | CompiledArea;

const validateDocumentFields = (config: UnknownConfig) => {
	const errors: string[] = [];
	const isCollection = (config: UnknownConfig): config is CompiledCollection =>
		config.type === 'collection';
	const isAuth = isCollection(config) && isAuthConfig(config);
	const registeredBlocks: Record<string, BlocksFieldRaw['blocks'][number]> = {};

	if (isAuth) {
		const hasRolesField = config.fields
			.filter(isFormField)
			.find((f) => f.name === 'roles' && f.type === 'select');
		const hasEmailField = config.fields
			.filter(isFormField)
			.find((f: FormField) => f.name === 'email' && f.type === 'email');
		if (!hasRolesField) errors.push(`Field roles is missing in collection ${config.slug}`);
		if (!hasEmailField) errors.push(`Field email is missing in collection ${config.slug}`);
	}

	const validateBlockField = (fields: FormField[], blockType: string) => {
		const reserved = ['path', 'type', 'parentId', 'position'];
		for (const key of reserved) {
			if (fields.map((f) => f.name).filter((name) => name === key).length > 1) {
				errors.push(`${key} is a reserved field in blocks (block ${blockType})`);
			}
		}
	};

	const validateFormFields = (fields: FormField[]) => {
		// Check for field name duplication at this level
		const duplicates = hasDuplicates(fields.map((f) => f.name));
		if (duplicates.length) {
			for (const duplicate of duplicates) {
				errors.push(`Duplicate field ${duplicate} in ${config.type} ${config.slug}`);
			}
		}

		for (const field of fields) {
			// Check for malformed field.name
			const withoutLeadingUnderscore = field.name.startsWith('_')
				? field.name.slice(1)
				: field.name;
			if (!isCamelCase(withoutLeadingUnderscore)) {
				errors.push(`Field ${field.name} of ${config.type} ${config.slug} should be camelCase`);
			}

			// Recursive check into Blocks Groups and Tabs
			if (isBlocksFieldRaw(field)) {
				for (const block of field.blocks) {
					if (block.name in registeredBlocks) {
						const blockDefinedButDiffer =
							JSON.stringify(registeredBlocks[block.name]) !== JSON.stringify(block);
						if (blockDefinedButDiffer) {
							errors.push(`Each block with same name should be identique (block ${block.name})`);
						}
					} else {
						registeredBlocks[block.name] = block;
					}
					validateFormFields(block.fields.filter(isFormField));
					validateBlockField(block.fields.filter(isFormField), block.name);
				}
			} else if (isTabsFieldRaw(field)) {
				for (const tab of field.tabs) {
					validateFormFields(tab.fields.filter(isFormField));
				}
			} else if (isGroupFieldRaw(field)) {
				validateFormFields(field.fields.filter(isFormField));
			}
		}
	};

	const formFields = config.fields.reduce(toFormFields, []);
	validateFormFields(formFields);

	return errors;
};

const hasDatabase = (config: CompiledConfig) => {
	const hasDatabaseName = 'database' in config && typeof config.database === 'string';
	if (!hasDatabaseName) {
		return ['config.database not defined'];
	}
	return [];
};

// function validateUploadCollections(config: CompiledConfig) {
// 	let errors = [];
// 	const uploadCollections = config.collections.filter(isUploadConfig);
// 	for (const collection of uploadCollections) {
// 		const hasImageSizes = 'imageSizes' in collection;
// 		const hasPanelThumbnail = 'panelThumbnail' in collection;
// 		if (!hasImageSizes) {
// 			errors.push(`collection.imagesSizes of ${collection.slug} should be defined`);
// 		}
// 		if (!hasPanelThumbnail) {
// 			errors.push(`collection.hasPanelThumbnail of ${collection.slug} should be defined`);
// 		}
// 	}
// 	return errors;
// }

function validate(config: CompiledConfig): boolean {
	const validateFunctions = [
		hasDuplicateSlug,
		hasUsersSlug,
		validateFields,
		hasDatabase
		// validateUploadCollections
	];

	for (const isValid of validateFunctions) {
		const errors: string[] = isValid(config);
		if (errors.length) {
			cache.clear();
			throw new Error('Config error : ' + errors[0]);
		}
	}

	return true;
}

export default validate;

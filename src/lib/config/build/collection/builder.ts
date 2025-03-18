import { date, text } from 'rizom/fields';
import type { Collection, ImageSizesConfig, User } from 'rizom/types';
import { isUploadConfig } from 'rizom/util/config';
import { capitalize, toCamelCase } from 'rizom/util/string';
import { isRolesField } from 'rizom/util/field';
import { findTitleField } from '../fields/findTitle';
import type { CollectionWithoutSlug } from './types';
import { usersFields } from '../../auth/usersFields.js';

export function collection<S extends string>(
	slug: S,
	config: CollectionWithoutSlug<S>
): Collection<S> {
	let fields: typeof config.fields = [...config.fields];

	// Augment Upload fields
	if (isUploadConfig(config)) {
		const isPanelThumbnailInSizes =
			config.imageSizes &&
			config.imageSizes.some((size: ImageSizesConfig) => size.name === 'thumbnail');
		if (!isPanelThumbnailInSizes) {
			const thumbnailSize = { name: 'thumbnail', width: 400, compression: 60 };
			config.imageSizes = [thumbnailSize, ...(config.imageSizes || [])];
		}
	}

	// Augment Status
	if (config.status) {
		if (config.status === true) {
			config.status = [
				{ value: 'draft', color: 'orange' },
				{ value: 'published', color: 'green' }
			];
		}
		fields.push(text('status').defaultValue(config.status[0].value).hidden());
	}

	// Augment Auth fields
	if (config.auth) {
		const isNotPanelUsersCollection = slug !== 'users';
		if (isNotPanelUsersCollection) {
			fields.push(usersFields.email);
			const rolesField = fields.find((field) => isRolesField(field.raw));
			if (!rolesField) {
				fields.push(usersFields.roles);
			}
		}
	}

	// Augment Upload fields
	if (isUploadConfig(config)) {
		if ('imageSizes' in config && config.imageSizes?.length) {
			const sizesFields = config.imageSizes.map((size: ImageSizesConfig) =>
				text(toCamelCase(size.name)).hidden()
			);
			fields = [...fields, ...sizesFields];
		}

		const mimeType = text('mimeType').hidden();

		if ('accept' in config) {
			const allowedExtensions = config.accept;
			mimeType.raw.validate = (value) => {
				return (
					(typeof value === 'string' && allowedExtensions.includes(value)) ||
					`File should be the type of ${allowedExtensions.toString()}`
				);
			};
		}
		fields.push(
			//
			mimeType,
			text('filename').hidden(),
			text('filesize').hidden()
		);
	}

	// Misc augment
	fields.push(
		//
		text('editedBy').hidden(),
		date('createdAt').hidden(),
		date('updatedAt').hidden()
	);

	config = setTitle(config);

	return {
		...config,
		slug,
		label: config.label
			? config.label
			: { singular: capitalize(slug), plural: capitalize(slug), gender: 'm' },
		fields,
		access: {
			create: (user?: User) => !!user,
			read: (user?: User) => !!user,
			update: (user?: User) => !!user,
			delete: (user?: User) => !!user,
			...config.access
		}
	};
}

export const setTitle = <T extends CollectionWithoutSlug<any>>(config: T) => {
	const addAsTitle = () => {
		const titleResult = findTitleField(config.fields);
		if (titleResult) return titleResult.path;
		if (config.upload) return 'filename';
		if (config.auth) return 'email';
		return 'id';
	};
	return {
		...config,
		asTitle: addAsTitle()
	};
};

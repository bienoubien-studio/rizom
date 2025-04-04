import { isRelationField } from '$lib/util/field.js';
import type { BeforeOperationRelation } from '$lib/sqlite/relations.js';
import type { Dic } from 'rizom/types/util.js';
import type { ConfigMap } from '../configMap/types.js';
import { getValueAtPath } from 'rizom/util/object.js';

type Args = {
	parentId?: string;
	data: Dic;
	configMap: ConfigMap;
	locale: string | undefined;
};

export const extractRelations = ({ parentId, data, configMap, locale }: Args) => {
	const relations: BeforeOperationRelation[] = [];

	for (const [path, config] of Object.entries(configMap)) {
		if (isRelationField(config)) {
			const value = getValueAtPath<BeforeOperationRelation[] | string | string[]>(path, data);

			const localized = config.localized;
			const relationRawValue = value;
			let output: BeforeOperationRelation[] = [];

			const relationFromString = ({ value, position = 0 }: RelationFromStringArgs) => {
				const result: BeforeOperationRelation = {
					position,
					relationTo: config.relationTo,
					documentId: value,
					parentId,
					path
				};
				if (localized) {
					result.locale = locale;
				}
				return result;
			};

			if (Array.isArray(relationRawValue)) {
				output = relationRawValue.map((value, n) => {
					if (typeof value === 'string') {
						return relationFromString({ value, position: n });
					}
					return value;
				});
				// Check if it's a string
			} else if (typeof relationRawValue === 'string') {
				output = [relationFromString({ value: relationRawValue, position: 0 })];
			}
			relations.push(...output);
		}
	}

	return relations;
};

type RelationFromStringArgs = {
	value: string;
	position?: number;
};

import type { BeforeOperationRelation, Relation } from 'rizom/db/relations';

type RelationDiff = {
	toAdd: BeforeOperationRelation[];
	toDelete: Relation[];
	toUpdate: Relation[];
};

type Args = {
	existingRelations: Relation[];
	extractedRelations: { relations: BeforeOperationRelation[]; emptyPaths: string[] };
	locale?: string;
};

export const defineRelationsDiff = ({
	existingRelations,
	extractedRelations,
	locale
}: Args): RelationDiff => {
	// 	locale
	// });

	const toAdd: BeforeOperationRelation[] = [];
	let toDelete: Relation[] = [];
	const toUpdate: Relation[] = [];

	const { relations: dataRelations, emptyPaths } = extractedRelations;

	// Group existing relations by path
	const existingByPath = existingRelations.reduce(
		(acc, rel) => {
			if (!acc[rel.path]) acc[rel.path] = [];
			acc[rel.path].push(rel);
			return acc;
		},
		{} as Record<string, Relation[]>
	);

	// Group data relations by path
	const dataByPath = dataRelations.reduce(
		(acc, rel) => {
			if (!acc[rel.path]) acc[rel.path] = [];
			acc[rel.path].push(rel);
			return acc;
		},
		{} as Record<string, BeforeOperationRelation[]>
	);

	// Process data relations to find updates and additions
	for (const newRel of dataRelations) {
		const existingForPath = existingByPath[newRel.path] || [];

		const match = existingForPath.find((existing) => {
			const relationIdKey = `${newRel.relationTo}Id` as keyof typeof existing;
			const sameId = existing[relationIdKey] === newRel.relationId;
			const sameLocale = newRel.locale
				? existing.locale === newRel.locale
				: existing.locale === null;

			return sameId && sameLocale;
		});

		if (match) {
			if (match.position !== newRel.position) {
				toUpdate.push({ ...match, position: newRel.position });
			}
		} else {
			toAdd.push(newRel);
		}
	}

	// Find relations to delete
	toDelete = existingRelations.filter((existing) => {
		// Keep relations from other locales
		if (existing.locale && existing.locale !== locale) {
			return false;
		}

		// If path is in emptyPaths, delete the relation
		if (emptyPaths.includes(existing.path)) {
			return true;
		}

		// Keep relations whose paths aren't in the data and not in emptyPaths
		if (!dataByPath[existing.path]) {
			return false;
		}

		// Delete if not found in new relations for this path
		const newRelsForPath = dataByPath[existing.path];
		return !newRelsForPath.some((newRel) => {
			const relationIdKey = `${newRel.relationTo}Id` as keyof typeof existing;
			const sameId = existing[relationIdKey] === newRel.relationId;
			const sameLocale = newRel.locale
				? existing.locale === newRel.locale
				: existing.locale === null;
			return sameId && sameLocale;
		});
	});

	return { toAdd, toDelete, toUpdate };
};

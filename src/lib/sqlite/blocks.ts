import { omit, pick, omitId } from '../util/object.js';
import { and, eq, getTableColumns, inArray, notInArray, type SQLWrapper } from 'drizzle-orm';
import { generatePK } from './util.js';
import { toPascalCase } from '../util/string.js';
import type { GenericBlock, PrototypeSlug } from 'rizom/types/doc.js';
import type { GenericAdapterInterfaceArgs } from 'rizom/types/adapter.js';

const createAdapterBlocksInterface = ({ db, tables }: GenericAdapterInterfaceArgs) => {
	//
	type KeyOfTables = keyof typeof tables;

	const buildBlockTableName = (slug: string, blockName: string) =>
		`${slug}Blocks${toPascalCase(blockName)}`;

	const update: UpdateBlock = async ({ parentSlug, block, locale }) => {
		const table = buildBlockTableName(parentSlug, block.type);
		const columns = Object.keys(getTableColumns(tables[table]));
		const values: Partial<GenericBlock> = pick(columns, omitId(block));

		if (Object.keys(values).length) {
			await db.update(tables[table]).set(values).where(eq(tables[table].id, block.id));
		}

		const keyTableLocales = `${table}Locales` as KeyOfTables;
		if (locale && keyTableLocales in tables) {
			const tableLocales = tables[keyTableLocales];

			const localizedColumns = Object.keys(getTableColumns(tableLocales)) as (keyof GenericBlock)[];

			const localizedValues = omit(['parentId', 'id'], pick(localizedColumns, block));
			if (!Object.keys(localizedValues).length) return true;
			//@ts-expect-error keyTableLocales is key of db.query
			const localizedRow = await db.query[keyTableLocales].findFirst({
				where: and(eq(tableLocales.parentId, block.id), eq(tableLocales.locale, locale))
			});

			if (!localizedRow) {
				await db.insert(tableLocales).values({
					...localizedValues,
					id: generatePK(),
					locale: locale,
					parentId: block.id
				});
			} else {
				await db
					.update(tableLocales)
					.set(localizedValues)
					.where(and(eq(tableLocales.parentId, block.id), eq(tableLocales.locale, locale)));
			}
		}
		return true;
	};

	const deleteBlock: DeleteBlock = async ({ parentSlug, block }) => {
		const table = buildBlockTableName(parentSlug, block.type);
		await db.delete(tables[table]).where(eq(tables[table].id, block.id));
		return true;
	};

	const create: CreateBlock = async ({ parentSlug, block, parentId, locale }) => {
		const table = buildBlockTableName(parentSlug, block.type);
		const blockId = generatePK();
		const tableLocales = `${table}Locales`;
		if (locale && tableLocales in tables) {
			const unlocalizedColumns = Object.keys(
				getTableColumns(tables[table])
			) as (keyof GenericBlock)[];

			const localizedColumns = Object.keys(
				getTableColumns(tables[tableLocales])
			) as (keyof GenericBlock)[];

			await db.insert(tables[table]).values({
				...pick(unlocalizedColumns, block),
				id: blockId,
				parentId: parentId
			});

			await db.insert(tables[tableLocales]).values({
				...pick(localizedColumns, block),
				id: generatePK(),
				parentId: blockId,
				locale
			});
		} else {
			const columns = Object.keys(getTableColumns(tables[table])) as (keyof GenericBlock)[];

			const values: Partial<GenericBlock> = pick(columns, block);

			await db.insert(tables[table]).values({
				...values,
				parentId,
				id: generatePK()
			});
		}
		return true;
	};

	// const deleteFromPaths: DeleteFromPaths = async ({ parentSlug, parentId, paths }) => {
	// 	if (!paths.length) return [];
	// 	const blocksTablesNames = getBlocksTableNames(parentSlug);
	// 	let deleted: any = [];
	// 	for (const tableName of blocksTablesNames) {
	// 		const table = tables[tableName];
	// 		const conditions: SQLWrapper[] = [
	// 			eq(table.parentId, parentId)
	// 			// inArray(table.path, paths)
	// 		];
	// 		const existingBlocks = await db
	// 			.select({ id: table.id, path: table.path })
	// 			.from(table)
	// 			.where(and(...conditions));

	// 		const toDelete = existingBlocks
	// 			.filter((row) => paths.some((path) => row.path.startsWith(path)))
	// 			.map((row) => row.id);

	// 		if (!toDelete.length) continue;
	// 		deleted = [
	// 			...deleted,
	// 			...((await db.delete(table).where(inArray(table.id, toDelete)).returning()) as any[])
	// 		];
	// 	}
	// 	return deleted;
	// };

	// const deleteBlocks = async ({
	// 	parentSlug,
	// 	ids,
	// 	parentId
	// }: DeleteBlockArgs): Promise<GenericBlock[]> => {
	// 	const blocksTablesNames = getBlocksTableNames(parentSlug);

	// 	let deletedBlocks: any = [];
	// 	for (const table of blocksTablesNames) {
	// 		if (ids && ids.length) {
	// 			const deleted = (await db
	// 				.delete(tables[table])
	// 				.where(and(eq(tables[table].parentId, parentId), notInArray(tables[table].id, ids)))
	// 				.returning()) as any[];
	// 			deletedBlocks = [...deletedBlocks, ...deleted];
	// 		} else {
	// 			const deleted = await db.delete(tables[table]).where(eq(tables[table].parentId, parentId));
	// 			deletedBlocks.push(deleted);
	// 		}
	// 	}

	// 	return deletedBlocks;
	// };

	const getBlocksTableNames = (slug: string): string[] =>
		Object.keys(tables).filter(
			(key) => key.startsWith(`${slug}Blocks`) && !key.endsWith('Locales')
		);

	return {
		getBlocksTableNames,
		// deleteFromPaths,
		delete: deleteBlock,
		create,
		update
	};
};

export default createAdapterBlocksInterface;

export type AdapterBlocksInterface = ReturnType<typeof createAdapterBlocksInterface>;
//////////////////////////////////////////////
// Types
//////////////////////////////////////////////

type UpdateBlock = (args: {
	parentSlug: PrototypeSlug;
	block: GenericBlock;
	locale?: string;
}) => Promise<boolean>;

type CreateBlock = (args: {
	parentSlug: PrototypeSlug;
	block: GenericBlock;
	parentId: string;
	locale?: string;
}) => Promise<boolean>;

type DeleteBlock = (args: { parentSlug: PrototypeSlug; block: GenericBlock }) => Promise<boolean>;

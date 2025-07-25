import { eq } from 'drizzle-orm';
import { buildWithParam } from './with.js';
import type { AreaSlug, GenericDoc, RawDoc } from '$lib/core/types/doc.js';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { DeepPartial, Dic } from '$lib/util/types.js';
import type { ConfigInterface } from '../core/config/index.server.js';
import { createBlankDocument } from '$lib/util/doc.js';
import { RizomError } from '$lib/core/errors/index.js';
import * as adapterUtil from './util.js';
import * as schemaUtil from '$lib/util/schema.js';
import { VERSIONS_OPERATIONS, VersionOperations } from '$lib/core/collections/versions/operations.js';
import { VERSIONS_STATUS } from '$lib/core/constant.js';
import type { GetRegisterType } from 'rizom';
import type { GenericTables } from './types.js';
import { getRequestEvent } from '$app/server';

type AreaInterfaceArgs = {
	db: BetterSQLite3Database<GetRegisterType<'Schema'>>;
	tables: GenericTables;
	configInterface: ConfigInterface;
};

/**
 * Creates an area interface for SQLite adapter operations with CRUD functionality.
 * Handles both versioned and non-versioned areas with support for localization.
 */
const createAdapterAreaInterface = ({ db, tables, configInterface }: AreaInterfaceArgs) => {
	/**
	 * Retrieves an area document. If the area doesn't exist, it creates a blank one.
	 * For versioned areas, returns either a specific version (if versionId is provided)
	 * or the latest/published version.
	 */
	const get: Get = async ({ slug, locale, select, versionId, draft }) => {
		const areaConfig = configInterface.getArea(slug);
		if (!areaConfig) {
			throw new RizomError(RizomError.INIT, slug + ' is not an area, should never happen');
		}

		const hasVersions = !!areaConfig.versions;

		if (!hasVersions) {
			const params = {
				columns: adapterUtil.columnsParams({ table: tables[slug], select }),
				with: buildWithParam({ slug, select, locale, tables, configInterface }) || undefined
			};

			// @ts-expect-error
			let doc = await db.query[slug].findFirst(params);

			if (!doc) {
				await createArea(slug, createBlankDocument(areaConfig, getRequestEvent()), locale);
				// @ts-expect-error
				doc = await db.query[slug].findFirst(params);
			}
			if (!doc) {
				throw new Error('Database error');
			}
			return doc;
		} else {
			// First check for record presence
			// @ts-expect-error
			let area = await db.query[slug].findFirst({ id: true });

			// If no area exists yet, create it
			if (!area) {
				await createArea(slug, createBlankDocument(areaConfig, getRequestEvent()), locale);
			}

			// Implementation for versioned areas
			const versionsTable = schemaUtil.makeVersionsSlug(slug);
			const withParam = buildWithParam({
				slug: versionsTable,
				select,
				locale,
				tables,
				configInterface
			});

			// Handle select columns for version table
			const versionSelectColumns = adapterUtil.columnsParams({
				table: tables[versionsTable],
				select
			});
			// Handle select columns for root table
			const rootSelectColumns = adapterUtil.columnsParams({ table: tables[slug], select });

			// Configure the query based on whether we want a specific version or the latest
			// For the "save in a new draft" action we need to get the published version
			let params: Dic;

			if (versionId) {
				// If versionId is provided, get that specific version
				params = {
					columns: rootSelectColumns,
					with: {
						[versionsTable]: {
							columns: versionSelectColumns,
							with: withParam,
							where: eq(tables[versionsTable].id, versionId)
						}
					}
				};
			} else {
				// get the latest
				params = {
					columns: rootSelectColumns,
					with: {
						[versionsTable]: {
							columns: versionSelectColumns,
							with: withParam,
							...adapterUtil.buildPublishedOrLatestVersionParams({
								draft,
								config: areaConfig,
								table: tables[versionsTable]
							})
						}
					}
				};
			}

			// @ts-expect-error suck
			let doc = await db.query[slug].findFirst(params);

			if (!doc) {
				throw new RizomError(RizomError.OPERATION_ERROR);
			}
			
			return adapterUtil.mergeRawDocumentWithVersion(doc, versionsTable, select);
		}
	};

	/**
	 * Creates a new area document. For versioned areas, creates both
	 * the root document and its first version. For non-versioned areas,
	 * creates a single document with the provided data.
	 *
	 * @example
	 * // Create a new area
	 * await createArea(
	 *   'settings',
	 *   { theme: 'light', notifications: true },
	 *   'en'
	 * );
	 *
	 * @returns For versioned areas, returns object with id and versionId
	 */
	const createArea = async (slug: AreaSlug, values: Partial<GenericDoc>, locale?: string) => {
		const now = new Date();
		const config = configInterface.getArea(slug);

		const hasVersions = !!config.versions;

		if (hasVersions) {
			// Create root document first
			const docId = await adapterUtil.insertTableRecord(db, tables, slug, {
				createdAt: now,
				updatedAt: now
			});

			// Generate version ID
			const versionsTableName = schemaUtil.makeVersionsSlug(slug);

			// Prepare data for versions table
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(values, {
				tables,
				mainTableName: versionsTableName,
				localesTableName: schemaUtil.makeLocalesSlug(versionsTableName),
				locale
			});

			if (config.versions && config.versions.draft) {
				mainData.status = 'published';
			}

			// Insert version record
			const versionId = await adapterUtil.insertTableRecord(db, tables, versionsTableName, {
				ownerId: docId,
				...mainData,
				createdAt: now,
				updatedAt: now
			});

			// Insert localized data if needed
			if (isLocalized && Object.keys(localizedData).length) {
				await adapterUtil.insertTableRecord(db, tables, schemaUtil.makeLocalesSlug(versionsTableName), {
					...localizedData,
					ownerId: versionId,
					locale: locale!
				});
			}

			// Return both IDs for versioned collections
			return {
				id: docId,
				versionId
			};
		} else {
			const tableLocales = schemaUtil.makeLocalesSlug(slug);

			// Prepare data for insertion using the shared utility function
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(values, {
				tables,
				mainTableName: slug,
				localesTableName: tableLocales,
				locale,
				fillNotNull: true
			});

			// Insert main record
			const createId = await adapterUtil.insertTableRecord(db, tables, slug, {
				...mainData
			});

			// Insert localized data if needed
			if (isLocalized) {
				await adapterUtil.insertTableRecord(db, tables, tableLocales, {
					...localizedData,
					ownerId: createId,
					locale
				});
			}
		}
	};

	/**
	 * Updates an area document using different versioning strategies.
	 * Supports multiple update patterns:
	 * - Simple update for non-versioned areas
	 * - Direct version update for versioned areas
	 * - Creating new versions from existing ones
	 * - Publishing draft versions
	 *
	 * @example
	 * // Update a non-versioned area
	 * const { id, versionId } = await update({
	 *   slug: 'settings',
	 *   data: { theme: 'dark' },
	 *   versionOperation: VERSIONS_OPERATIONS.UPDATE
	 * });
	 *
	 * // Update a specific version
	 * const { id, versionId } = await update({
	 *   slug: 'site-info',
	 *   data: { title: 'Updated Title' },
	 *   versionId: 'v456',
	 *   versionOperation: VERSIONS_OPERATIONS.UPDATE_VERSION
	 * });
	 *
	 * // Create a new draft from published version
	 * const { id, versionId } = await update({
	 *   slug: 'settings',
	 *   data: { theme: 'system' },
	 *   versionOperation: VERSIONS_OPERATIONS.NEW_DRAFT_FROM_PUBLISHED
	 * });
	 *
	 * @returns Object containing the IDs of the updated area and version
	 * @throws RizomError when operation fails or version ID is missing when required
	 */
	const update: Update = async ({ slug, data, locale, versionId, versionOperation }) => {
		const now = new Date();
		const areaConfig = configInterface.getArea(slug);

		const rows = await db.select({ id: tables[slug].id }).from(tables[slug]);
		const area = rows[0];

		// Simple update for non-versioned areas
		if (VersionOperations.isSimpleUpdate(versionOperation)) {
			// Original implementation for non-versioned areas
			const keyTableLocales = schemaUtil.makeLocalesSlug(slug);
			// Prepare data for update using the shared utility function
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: slug,
				localesTableName: keyTableLocales,
				locale
			});

			// Update main table
			await adapterUtil.updateTableRecord(db, tables, slug, {
				recordId: area.id,
				data: { ...mainData, updatedAt: now }
			});

			// Update localized data if needed
			if (isLocalized) {
				await adapterUtil.upsertLocalizedData(db, tables, keyTableLocales, {
					ownerId: area.id,
					data: localizedData,
					locale: locale!
				});
			}

			// For non-versioned areas, versionId is the same as id
			return { id: area.id };
		} else if (VersionOperations.isSpecificVersionUpdate(versionOperation)) {
			// Scenario 1: Update a specific version directly
			if (!versionId) {
				throw new RizomError(RizomError.OPERATION_ERROR, 'missing versionId @adapter-update-area');
			}
			// First, update the root table's updatedAt
			await db
				.update(tables[slug])
				.set({
					updatedAt: now
				})
				.where(eq(tables[slug].id, area.id));

			const versionsTable = schemaUtil.makeVersionsSlug(slug);
			const versionsLocalesTable = schemaUtil.makeLocalesSlug(versionsTable);
			
			// Prepare data for update using the shared utility function
			const { mainData, localizedData, isLocalized } = adapterUtil.prepareSchemaData(data, {
				tables,
				mainTableName: versionsTable,
				localesTableName: versionsLocalesTable,
				locale
			});
			// if draft is enabled on the collection
			if (areaConfig.versions && areaConfig.versions.draft && mainData.status === 'published') {
				// update all rows first to draft
				await db.update(tables[versionsTable]).set({ status: VERSIONS_STATUS.DRAFT });
			}
			// Update version directly
			await adapterUtil.updateTableRecord(db, tables, versionsTable, {
				recordId: versionId,
				data: { ...mainData, updatedAt: now }
			});
			// Update localized data if needed
			if (isLocalized) {
				await adapterUtil.upsertLocalizedData(db, tables, versionsLocalesTable, {
					ownerId: versionId,
					data: localizedData,
					locale: locale!
				});
			}

			return { id: area.id };
		} else if (VersionOperations.isNewVersionCreation(versionOperation)) {
			// Scenario 2: version creation, update only main table
			// the creation is handled by the caller update operation
			await db
				.update(tables[slug])
				.set({
					updatedAt: now
				})
				.where(eq(tables[slug].id, area.id));

			return { id: area.id };
		} else {
			throw new RizomError(RizomError.OPERATION_ERROR, 'Unhandled version operation');
		}
	};

	return {
		update,
		createArea,
		get
	};
};

export default createAdapterAreaInterface;

export type AdapterAreaInterface = ReturnType<typeof createAdapterAreaInterface>;

/****************************************************/
/* Types
/****************************************************/

type Get = (args: {
	slug: AreaSlug;
	locale?: string;
	depth?: number;
	select?: string[];
	/** Optional parameter to get a specific version */
	versionId?: string;
	/** Optional parameter if versionId is not defined and draft=true
	 * 	it will get the latest doc no matter its status
	 * 	else the published document will be retrieved
	 */
	draft?: boolean;
}) => Promise<RawDoc>;

type Update = (args: {
	slug: AreaSlug;
	data: DeepPartial<GenericDoc>;
	locale?: string;
	/** Optional parameter to specify direct version update */
	versionId?: string;
	versionOperation: (typeof VERSIONS_OPERATIONS)[keyof typeof VERSIONS_OPERATIONS];
}) => Promise<{ id: string }>;

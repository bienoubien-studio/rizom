import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export type { Adapter } from '$lib/sqlite/index.server.js';

export type GenericAdapterInterfaceArgs = {
	db: BetterSQLite3Database<any>;
	tables: any;
};

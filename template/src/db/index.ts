import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const isLocalDatabase = (databaseUrl: string) => {
	const hostname = new URL(databaseUrl).hostname;
	return hostname === 'localhost' || hostname === '127.0.0.1';
};

const createNeonDb = (databaseUrl: string) => {
	const sql = neon(databaseUrl);
	return drizzle(sql, { schema, casing: 'snake_case' });
};

const neonDbCache = new Map<string, ReturnType<typeof createNeonDb>>();

const getNeonDb = (databaseUrl: string) => {
	const cached = neonDbCache.get(databaseUrl);
	if (cached) return cached;

	const db = createNeonDb(databaseUrl);
	neonDbCache.set(databaseUrl, db);
	return db;
};

export const createDbConnection = async (databaseUrl: string) => {
	if (isLocalDatabase(databaseUrl)) {
		const [{ Client }, { drizzle }] = await Promise.all([
			import('pg'),
			import('drizzle-orm/node-postgres'),
		]);

		const client = new Client({ connectionString: databaseUrl });
		await client.connect();

		return {
			db: drizzle(client, { schema, casing: 'snake_case' }),
			dispose: () => client.end(),
		};
	}

	return {
		db: getNeonDb(databaseUrl),
		dispose: undefined,
	};
};

export type Db = Awaited<ReturnType<typeof createDbConnection>>['db'];

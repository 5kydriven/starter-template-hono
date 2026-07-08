import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const neonDbCache = new Map<
	string,
	ReturnType<typeof drizzle<typeof schema>>
>();

export async function createDbConnection(databaseUrl: string) {
	const hostname = new URL(databaseUrl).hostname;

	if (hostname === 'localhost' || hostname === '127.0.0.1') {
		const [{ Client }, { drizzle: pgDrizzle }] = await Promise.all([
			import('pg'),
			import('drizzle-orm/node-postgres'),
		]);

		const client = new Client({ connectionString: databaseUrl });
		await client.connect();

		return {
			db: pgDrizzle(client, { schema, casing: 'snake_case' }),
			dispose: () => client.end(),
		};
	}

	let db = neonDbCache.get(databaseUrl);

	if (!db) {
		db = drizzle(neon(databaseUrl), {
			schema,
			casing: 'snake_case',
		});

		neonDbCache.set(databaseUrl, db);
	}

	return {
		db,
		dispose: undefined,
	};
}

export type DB = Awaited<ReturnType<typeof createDbConnection>>['db'];

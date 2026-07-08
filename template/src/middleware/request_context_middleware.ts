import { createMiddleware } from 'hono/factory';
import { createAuth } from '@/config/auth';
import { createDbConnection } from '@/db';
import type { AppBindings } from '@/config/app_bindings';

export const requestContextMiddleware = createMiddleware<AppBindings>(
	async (c, next) => {
		const { db, dispose } = await createDbConnection(c.env.DATABASE_URL);
		const auth = createAuth(db, c.env);

		c.set('db', db);
		c.set('auth', auth);

		try {
			await next();
		} finally {
			await dispose?.();
		}
	},
);

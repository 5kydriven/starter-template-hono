import { MiddlewareHandler } from 'hono';
import { createDbConnection } from '@/db';

export const dbMiddleware = (): MiddlewareHandler => async (c, next) => {
	const { db, dispose } = await createDbConnection(c.env.DATABASE_URL);
	c.set('db', db);

	try {
		await next();
	} finally {
		await dispose?.();
	}
};

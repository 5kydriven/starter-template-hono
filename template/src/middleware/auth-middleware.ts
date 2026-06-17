import { createMiddleware } from 'hono/factory';
import { createAuth } from '@/config/auth';
import type { AppBindings } from '@/config/app-bindings';

export const authMiddleware = createMiddleware<AppBindings>(async (c, next) => {
	// const { db, dispose } = await createDbConnection(c.env.DATABASE_URL);
	// const auth = createAuth(db, c.env);
	// c.set('db', db);
	// c.set('auth', auth);
	// try {
	// 	await next();
	// } finally {
	// 	await dispose?.();
	// }
});

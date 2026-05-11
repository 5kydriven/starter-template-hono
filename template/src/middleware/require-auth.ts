import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '../types/app';

export const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	const user = c.get('user');

	if (!user) {
		throw new HTTPException(401, {
			message: 'Unauthorized',
		});
	}

	await next();
};

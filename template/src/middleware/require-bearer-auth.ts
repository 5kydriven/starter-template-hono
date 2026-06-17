import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppBindings } from '@/config/app-bindings';

export const requireBearerAuth = createMiddleware<AppBindings>(
	async (c, next) => {
		let bearerHeader;
		if (c.req.header('Authorization')?.toLowerCase().startsWith('bearer ')) {
			bearerHeader = c.req.header('Authorization')?.slice(7).trim() ?? null;
		} else {
			bearerHeader = null;
		}

		if (!bearerHeader) {
			throw new HTTPException(401, {
				message: 'Missing bearer token',
			});
		}

		const auth = c.get('auth');
		const { headers, response } = await auth.api.getSession({
			headers: new Headers({
				authorization: bearerHeader,
			}),
			returnHeaders: true,
		});

		headers.forEach((value, key) => {
			if (key.toLowerCase() === 'set-cookie') return;

			c.res.headers.set(key, value);
		});

		if (!response) {
			throw new HTTPException(401, {
				message: 'Invalid bearer token',
			});
		}

		c.set('user', response.user);
		c.set('session', response.session);

		await next();
	},
);

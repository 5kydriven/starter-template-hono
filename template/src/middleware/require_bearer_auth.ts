import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import type { AppBindings } from '@/config/app_bindings';

export const requireBearerAuth = createMiddleware<AppBindings>(
	async (c, next) => {
		const authorizationHeader = c.req.header('Authorization') ?? '';
		const bearerToken = authorizationHeader.toLowerCase().startsWith('bearer ')
			? authorizationHeader.slice(7).trim()
			: null;

		if (!bearerToken) {
			throw new HTTPException(401, {
				message: 'Missing bearer token',
			});
		}

		const auth = c.get('auth');
		const { headers, response } = await auth.api.getSession({
			headers: new Headers({
				authorization: authorizationHeader,
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

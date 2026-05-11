import type { Context, MiddlewareHandler } from 'hono';
import { createAuth } from '../lib/auth';
import type { AppEnv } from '../types/app';

const appendAuthHeaders = (headers: Headers, c: Context<AppEnv>) => {
	headers.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie') {
			c.header('Set-Cookie', value, { append: true });
			return;
		}

		c.header(key, value);
	});
};

export const withAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	const db = c.get('db');
	const auth = createAuth(db, c.env);

	const { headers, response: session } = await auth.api.getSession({
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	c.set('auth', auth);

	c.set(
		'user',
		session?.user
			? {
					id: session.user.id,
					email: session.user.email,
					name: session.user.name,
					role: (session.user as any).role ?? 'member',
				}
			: null,
	);

	c.set(
		'session',
		session?.session
			? {
					id: session.session.id,
					userId: session.session.userId,
					expiresAt: session.session.expiresAt,
				}
			: null,
	);

	appendAuthHeaders(headers, c);
	await next();
};

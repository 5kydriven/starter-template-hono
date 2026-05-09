import type { MiddlewareHandler } from 'hono';
import { appendAuthHeaders } from '@/lib/auth-headers';
import { isUserRole } from '@/constants/roles';
import { createAuth } from '../lib/auth';
import type { AppEnv } from '../types/app';

export const withAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	const db = c.get('db');
	const auth = createAuth(db, c.env);

	const { headers, response: session } = await auth.api.getSession({
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	c.set('auth', auth);

	const sessionUser = session?.user
		? (session.user as typeof session.user & { role?: unknown })
		: null;

	c.set(
		'user',
		sessionUser
			? {
					id: sessionUser.id,
					email: sessionUser.email,
					name: sessionUser.name,
					role: isUserRole(sessionUser.role) ? sessionUser.role : 'student',
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

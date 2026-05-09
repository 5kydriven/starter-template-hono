import type { RouteHandler } from '@hono/zod-openapi';
import { HTTPException } from 'hono/http-exception';
import { appendAuthHeaders } from '@/lib/auth-headers';
import { isUserRole } from '@/constants/roles';
import type { AppEnv } from '@/types/app';
import type {
	loginRoute,
	logoutRoute,
	meRoute,
	registerRoute,
} from './auth.route';

const toAuthUser = (user: {
	id: string;
	name: string;
	email: string;
	role?: string | null;
}) => {
	const role = isUserRole(user.role) ? user.role : 'student';

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role,
	};
};

export const register: RouteHandler<typeof registerRoute, AppEnv> = async (
	c,
) => {
	const body = c.req.valid('json');
	const auth = c.get('auth');

	const result = await auth.api.signUpEmail({
		body,
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	appendAuthHeaders(result.headers, c);

	return c.json(
		{
			user: toAuthUser(result.response.user),
		},
		200,
	);
};

export const login: RouteHandler<typeof loginRoute, AppEnv> = async (c) => {
	const body = c.req.valid('json');
	const auth = c.get('auth');

	const result = await auth.api.signInEmail({
		body,
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	appendAuthHeaders(result.headers, c);

	return c.json(
		{
			user: toAuthUser(result.response.user),
		},
		200,
	);
};

export const logout: RouteHandler<typeof logoutRoute, AppEnv> = async (c) => {
	const auth = c.get('auth');

	const result = await auth.api.signOut({
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	appendAuthHeaders(result.headers, c);

	return c.json(result.response, 200);
};

export const me: RouteHandler<typeof meRoute, AppEnv> = async (c) => {
	const user = c.get('user');
	const session = c.get('session');

	if (!user || !session) {
		throw new HTTPException(401, {
			message: 'Unauthorized',
		});
	}

	return c.json(
		{
			user,
			session: {
				id: session.id,
				userId: session.userId,
				expiresAt: session.expiresAt.toISOString(),
			},
		},
		200,
	);
};

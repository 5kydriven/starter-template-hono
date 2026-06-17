import type { RouteHandler } from '@hono/zod-openapi';
import type { AppBindings } from '@/config/app_bindings';
import {
	registerRoute,
	loginRoute,
	logoutRoute,
	meRoute,
} from '@/routes/auth_route';

type AuthUser = AppBindings['Variables']['user'];
type AuthSession = AppBindings['Variables']['session'];

const toAuthUserResponse = (user: AuthUser) => ({
	id: user.id,
	name: user.name,
	email: user.email,
	emailVerified: user.emailVerified,
	image: user.image ?? null,
	role: user.role ?? undefined,
	createdAt: user.createdAt.toISOString(),
	updatedAt: user.updatedAt.toISOString(),
});

const toAuthSessionResponse = (session: AuthSession) => ({
	id: session.id,
	userId: session.userId,
	token: session.token,
	expiresAt: session.expiresAt.toISOString(),
	ipAddress: session.ipAddress ?? null,
	userAgent: session.userAgent ?? null,
	createdAt: session.createdAt.toISOString(),
	updatedAt: session.updatedAt.toISOString(),
});

const copyAuthHeaders = (from: Headers, to: Headers) => {
	from.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie') return;

		to.set(key, value);
	});
};

export const register: RouteHandler<typeof registerRoute, AppBindings> = async (
	c,
) => {
	const auth = c.get('auth');
	const body = c.req.valid('json');
	const { headers, response } = await auth.api.signUpEmail({
		body,
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	copyAuthHeaders(headers, c.res.headers);

	return c.json(
		{
			user: toAuthUserResponse(response.user),
			token: null,
		},
		201,
	);
};

export const login: RouteHandler<typeof loginRoute, AppBindings> = async (
	c,
) => {
	const auth = c.get('auth');
	const body = c.req.valid('json');
	const { headers, response } = await auth.api.signInEmail({
		body,
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	copyAuthHeaders(headers, c.res.headers);

	return c.json(
		{
			user: toAuthUserResponse(response.user),
			token: response.token,
		},
		200,
	);
};

export const logout: RouteHandler<typeof logoutRoute, AppBindings> = async (
	c,
) => {
	const auth = c.get('auth');
	const headers = new Headers({
		authorization: c.req.header('Authorization') ?? '',
	});
	const result = await auth.api.signOut({
		headers,
		returnHeaders: true,
	});

	copyAuthHeaders(result.headers, c.res.headers);

	return c.json(result.response, 200);
};

export const me: RouteHandler<typeof meRoute, AppBindings> = async (c) => {
	return c.json(
		{
			user: toAuthUserResponse(c.get('user')),
			session: toAuthSessionResponse(c.get('session')),
		},
		200,
	);
};

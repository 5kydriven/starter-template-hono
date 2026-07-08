import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { requireBearerAuth } from '@/middleware/require_bearer_auth';
import type { AppBindings } from '@/config/app_bindings';
import {
	AuthTokenResponseSchema,
	ErrorResponseSchema,
	LoginSchema,
	LogoutResponseSchema,
	MeResponseSchema,
	RegisterSchema,
} from '@/shared/auth_schema';
import { login, logout, me, register } from '@/handlers/auth_handler';

export const authRoute = new OpenAPIHono<AppBindings>();

export const registerRoute = createRoute({
	method: 'post',
	path: '/register',
	tags: ['Auth'],
	summary: 'Register a user',
	request: {
		body: {
			content: {
				'application/json': {
					schema: RegisterSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: 'User registered',
			content: {
				'application/json': {
					schema: AuthTokenResponseSchema,
				},
			},
		},
		400: {
			description: 'Invalid register request',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
		422: {
			description: 'Unable to register user',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const loginRoute = createRoute({
	method: 'post',
	path: '/login',
	tags: ['Auth'],
	summary: 'Log in with email and password',
	request: {
		body: {
			content: {
				'application/json': {
					schema: LoginSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: 'Authenticated',
			content: {
				'application/json': {
					schema: AuthTokenResponseSchema,
				},
			},
		},
		401: {
			description: 'Invalid credentials',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const logoutRoute = createRoute({
	method: 'post',
	path: '/logout',
	tags: ['Auth'],
	summary: 'Log out current bearer session',
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: 'Logged out',
			content: {
				'application/json': {
					schema: LogoutResponseSchema,
				},
			},
		},
		401: {
			description: 'Missing or invalid bearer token',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

export const meRoute = createRoute({
	method: 'get',
	path: '/me',
	tags: ['Auth'],
	summary: 'Get current bearer session',
	security: [{ Bearer: [] }],
	responses: {
		200: {
			description: 'Current authenticated user',
			content: {
				'application/json': {
					schema: MeResponseSchema,
				},
			},
		},
		401: {
			description: 'Missing or invalid bearer token',
			content: {
				'application/json': {
					schema: ErrorResponseSchema,
				},
			},
		},
	},
});

authRoute.openapi(registerRoute, register);
authRoute.openapi(loginRoute, login);
authRoute.use('/logout', requireBearerAuth);
authRoute.openapi(logoutRoute, logout);
authRoute.use('/me', requireBearerAuth);
authRoute.openapi(meRoute, me);

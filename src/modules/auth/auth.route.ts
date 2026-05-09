import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { requireAuth } from '@/middleware/require-auth';
import type { AppEnv } from '@/types/app';
import {
	AuthResponseSchema,
	LoginSchema,
	LogoutResponseSchema,
	MeResponseSchema,
	RegisterSchema,
} from './auth.schema';
import { login, logout, me, register } from './auth.handler';
import { unauthorized, validationError } from '@/lib/openapi-responses';

export const registerRoute = createRoute({
	method: 'post',
	path: '/register',
	tags: ['Auth'],
	summary: 'Register a new user',
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
		200: {
			description: 'Registered user',
			content: {
				'application/json': {
					schema: AuthResponseSchema,
				},
			},
		},
		422: validationError,
	},
});

export const loginRoute = createRoute({
	method: 'post',
	path: '/login',
	tags: ['Auth'],
	summary: 'Login a user',
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
			description: 'Authenticated user',
			content: {
				'application/json': {
					schema: AuthResponseSchema,
				},
			},
		},
		401: unauthorized,
		422: validationError,
	},
});

export const logoutRoute = createRoute({
	method: 'post',
	path: '/logout',
	tags: ['Auth'],
	summary: 'Logout current user',
	responses: {
		200: {
			description: 'Logged out',
			content: {
				'application/json': {
					schema: LogoutResponseSchema,
				},
			},
		},
		401: unauthorized,
	},
});

export const meRoute = createRoute({
	method: 'get',
	path: '/me',
	tags: ['Auth'],
	summary: 'Get current user',
	responses: {
		200: {
			description: 'Current authenticated user',
			content: {
				'application/json': {
					schema: MeResponseSchema,
				},
			},
		},
		401: unauthorized,
	},
});

export const authRoute = new OpenAPIHono<AppEnv>();

authRoute.openapi(registerRoute, register);
authRoute.openapi(loginRoute, login);
authRoute.use('/logout', requireAuth);
authRoute.openapi(logoutRoute, logout);
authRoute.use('/me', requireAuth);
authRoute.openapi(meRoute, me);

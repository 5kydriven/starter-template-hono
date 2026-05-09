import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { requireAuth } from '@/middleware/require-auth';
import type { AppEnv } from '@/types/app';
import {
	AuthResponseSchema,
	LoginSchema,
	LogoutResponseSchema,
	MeResponseSchema,
	RegisterSchema,
	StudentAuthResponseSchema,
	StudentLoginSchema,
	StudentRegisterSchema,
	StudentVerifyQuerySchema,
	StudentVerifyResponseSchema,
} from './auth.schema';
import {
	login,
	logout,
	me,
	studentLogin,
	studentRegister,
	studentVerify,
} from './auth.handler';
import {
	conflict,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';

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

export const studentVerifyRoute = createRoute({
	method: 'get',
	path: '/student/verify',
	tags: ['Auth'],
	summary: 'Verify student auth flow by student number',
	request: { query: StudentVerifyQuerySchema },
	responses: {
		200: {
			description: 'Student auth flow status',
			content: {
				'application/json': {
					schema: StudentVerifyResponseSchema,
				},
			},
		},
		422: validationError,
	},
});

export const studentRegisterRoute = createRoute({
	method: 'post',
	path: '/student/register',
	tags: ['Auth'],
	summary: 'Register an allowlisted student',
	request: {
		body: {
			content: {
				'application/json': {
					schema: StudentRegisterSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: 'Registered student',
			content: {
				'application/json': {
					schema: StudentAuthResponseSchema,
				},
			},
		},
		409: conflict,
		422: validationError,
	},
});

export const studentLoginRoute = createRoute({
	method: 'post',
	path: '/student/login',
	tags: ['Auth'],
	summary: 'Login a student by student number',
	request: {
		body: {
			content: {
				'application/json': {
					schema: StudentLoginSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: 'Authenticated student',
			content: {
				'application/json': {
					schema: StudentAuthResponseSchema,
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

authRoute.openapi(loginRoute, login);
authRoute.openapi(studentVerifyRoute, studentVerify);
authRoute.openapi(studentRegisterRoute, studentRegister);
authRoute.openapi(studentLoginRoute, studentLogin);
authRoute.use('/logout', requireAuth);
authRoute.openapi(logoutRoute, logout);
authRoute.use('/me', requireAuth);
authRoute.openapi(meRoute, me);

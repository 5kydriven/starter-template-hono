import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { errorHandler } from '@/middleware/error_handler';
import { logger } from 'hono/logger';
import { AppBindings } from './config/app_bindings';
import { authRoute } from './routes/auth_route';
import { requestContextMiddleware } from './middleware/request_context_middleware';
import { APIError } from 'better-auth';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';
import { AppError } from './shared/errors';

const app = new OpenAPIHono<AppBindings>();

app.onError((err, c) => {
	if (err instanceof AppError) {
		return c.json(
			{ error: { code: err.code, message: err.message, details: err.details } },
			err.statusCode as any,
		);
	}

	if (err instanceof HTTPException) {
		return c.json(
			{
				error: {
					code: err.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
					message: err.message,
					details: [],
				},
			},
			err.status,
		);
	}

	if (err instanceof APIError) {
		return c.json(
			{
				error: {
					code: err.body?.code ?? 'UNAUTHORIZED',
					message: err.body?.message ?? err.message,
					details: [],
				},
			},
			err.statusCode as any,
		);
	}

	if (err instanceof ZodError) {
		const details = err.issues.map((i) => ({
			field: i.path.join('.'),
			message: i.message,
		}));
		return c.json(
			{
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details,
				},
			},
			422,
		);
	}

	console.error('[error]', err);
	return c.json(
		{
			error: {
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred',
				details: [],
			},
		},
		500,
	);
});

app.use(
	'*',
	cors({
		origin: (origin, c) => {
			const allowedOrigin = c.env.CORS_ORIGIN;

			if (!origin) return allowedOrigin;
			if (origin === allowedOrigin) return origin;

			return allowedOrigin;
		},
		allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowHeaders: ['Content-Type', 'Authorization'],
		exposeHeaders: ['set-auth-token'],
		credentials: true,
	}),
);

app.openAPIRegistry.registerComponent('securitySchemes', 'Bearer', {
	type: 'http',
	scheme: 'bearer',
	bearerFormat: 'Session token',
});

app.doc('/openapi.json', (c) => ({
	openapi: '3.0.0',
	info: {
		title: 'Starter Template Hono API',
		version: '1.0.0',
		description:
			'Cloudflare Worker API built with Hono, Better Auth, Drizzle, and OpenAPI.',
	},
	servers: [
		{
			url: new URL(c.req.url).origin,
			description: 'Current environment',
		},
	],
}));

app.get(
	'/docs',
	Scalar({
		url: '/openapi.json',
		pageTitle: 'Starter Template Hono API Docs',
	}),
);

app.use('*', logger());

app.use('/api/v1/auth/*', requestContextMiddleware);
app.route('/api/v1/auth', authRoute);

app.get('/', (c) => c.text('Server is Running'));

export default app;

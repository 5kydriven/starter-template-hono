import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { errorHandler } from '@/middleware/error-handler';
import { logger } from 'hono/logger';
import { AppBindings } from './config/app-bindings';
import { requestContextMiddleware } from '@/middleware/request-context-middleware';
import { authRoute } from './routes/auth_route';

const app = new OpenAPIHono<AppBindings>();

app.onError(errorHandler);

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

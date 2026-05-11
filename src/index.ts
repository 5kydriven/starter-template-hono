import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { dbMiddleware } from '@/middleware/db';
import { cors } from 'hono/cors';
import { withAuth } from '@/middleware/with-auth';
import { authRoute } from '@/modules/auth/auth.route';
import { coursesRoute } from '@/modules/courses/courses.route';
import { errorHandler } from '@/middleware/error-handler';
import { staffProfilesRoute } from '@/modules/staff_profiles/staff_profiles.route';
import { studentAllowlistsRoute } from '@/modules/student_allowlists/student_allowlists.route';
import type { AppEnv } from '@/types/app';
import { logger } from 'hono/logger';
import { programOfferingsRoute } from './modules/program_offerings/program_offerings.route';
import { scholarshipProgramsRoute } from './modules/scholarship_programs/scholarship_programs.route';
import { parentsRoute } from './modules/parents/parents.route';

const app = new OpenAPIHono<AppEnv>();

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
		credentials: true,
	}),
);

app.doc('/openapi.json', (c) => ({
	openapi: '3.0.0',
	info: {
		title: 'CPSU Scholarship API',
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
		pageTitle: 'CPSU Scholarship API Docs',
	}),
);

app.use('*', logger());
app.use('*', dbMiddleware());
app.use('*', withAuth);

app.get('/', (c) => c.text('Server is up and running'));

app.route('/api/v1/auth', authRoute);
app.route('/api/v1/courses', coursesRoute);
app.route('/api/v1/personnels', staffProfilesRoute);
app.route('/api/v1/student-allowlists', studentAllowlistsRoute);
app.route('/api/v1/scholarship-programs', scholarshipProgramsRoute);
app.route('/api/v1/program-offerings', programOfferingsRoute);
app.route('/api/v1/parents', parentsRoute);

export default app;

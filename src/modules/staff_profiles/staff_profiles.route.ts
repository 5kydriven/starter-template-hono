import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { requireRole } from '@/middleware/require-role';
import type { AppEnv } from '@/types/app';
import { createStaffProfile } from './staff_profiles.handler';
import {
	CreateStaffProfileResponseSchema,
	CreateStaffProfileSchema,
} from './staff_profiles.schema';
import { requireAuth } from '@/middleware/require-auth';
import {
	forbidden,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';

export const createStaffProfileRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Staff Profiles'],
	summary: 'Create a personnel account and staff profile',
	request: {
		body: {
			content: {
				'application/json': {
					schema: CreateStaffProfileSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		201: {
			description: 'Created personnel staff profile',
			content: {
				'application/json': {
					schema: CreateStaffProfileResponseSchema,
				},
			},
		},
		401: unauthorized,
		403: forbidden,
		422: validationError,
	},
});

export const staffProfilesRoute = new OpenAPIHono<AppEnv>();

staffProfilesRoute.use('/', requireAuth, requireRole('admin'));
staffProfilesRoute.openapi(createStaffProfileRoute, createStaffProfile);

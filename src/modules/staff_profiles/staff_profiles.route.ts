import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import { requireRole } from '@/middleware/require-role';
import type { AppEnv } from '@/types/app';
import {
	createStaffProfile,
	deleteStaffProfile,
	getStaffProfile,
	listStaffProfiles,
	listStaffProfilesCursor,
	updateStaffProfile,
} from './staff_profiles.handler';
import {
	CreateStaffProfileSchema,
	StaffProfileParamsSchema,
	StaffProfileSchema,
	StaffProfilesCursorQuerySchema,
	StaffProfilesCursorResponseSchema,
	StaffProfilesOffsetQuerySchema,
	StaffProfilesOffsetResponseSchema,
	UpdateStaffProfileSchema,
} from './staff_profiles.schema';
import { requireAuth } from '@/middleware/require-auth';
import {
	deleted,
	forbidden,
	notFound,
	unauthorized,
	validationError,
} from '@/lib/openapi-responses';

export const listStaffProfilesRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Personnels'],
	summary: 'List personnels (offset pagination)',
	request: { query: StaffProfilesOffsetQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: StaffProfilesOffsetResponseSchema },
			},
			description: 'OK',
		},
		401: unauthorized,
		403: forbidden,
	},
});

export const listStaffProfilesCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Personnels'],
	summary: 'List personnels (cursor pagination)',
	request: { query: StaffProfilesCursorQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: StaffProfilesCursorResponseSchema },
			},
			description: 'OK',
		},
		401: unauthorized,
		403: forbidden,
	},
});

export const getStaffProfileRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Personnels'],
	summary: 'Get personnel by ID',
	request: { params: StaffProfileParamsSchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: StaffProfileSchema },
			},
			description: 'OK',
		},
		401: unauthorized,
		403: forbidden,
		404: notFound,
		422: validationError,
	},
});

export const createStaffProfileRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Personnels'],
	summary: 'Create a personnel account',
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
					schema: StaffProfileSchema,
				},
			},
		},
		401: unauthorized,
		403: forbidden,
		422: validationError,
	},
});

export const updateStaffProfileRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Personnels'],
	summary: 'Update personnel by ID',
	request: {
		params: StaffProfileParamsSchema,
		body: {
			content: {
				'application/json': {
					schema: UpdateStaffProfileSchema,
				},
			},
			required: true,
		},
	},
	responses: {
		200: {
			description: 'Updated personnel profile',
			content: {
				'application/json': {
					schema: StaffProfileSchema,
				},
			},
		},
		401: unauthorized,
		403: forbidden,
		404: notFound,
		422: validationError,
	},
});

export const deleteStaffProfileRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Personnels'],
	summary: 'Delete personnel by ID',
	request: { params: StaffProfileParamsSchema },
	responses: {
		204: deleted,
		401: unauthorized,
		403: forbidden,
		404: notFound,
		422: validationError,
	},
});

export const staffProfilesRoute = new OpenAPIHono<AppEnv>();

staffProfilesRoute.use('/cursor', requireAuth, requireRole('admin'));
staffProfilesRoute.openapi(
	listStaffProfilesCursorRoute,
	listStaffProfilesCursor,
);

staffProfilesRoute.use('/', requireAuth, requireRole('admin'));
staffProfilesRoute.openapi(createStaffProfileRoute, createStaffProfile);
staffProfilesRoute.openapi(listStaffProfilesRoute, listStaffProfiles);

staffProfilesRoute.use('/:id', requireAuth, requireRole('personnel'));
staffProfilesRoute.openapi(getStaffProfileRoute, getStaffProfile);
staffProfilesRoute.openapi(updateStaffProfileRoute, updateStaffProfile);
staffProfilesRoute.openapi(deleteStaffProfileRoute, deleteStaffProfile);

import { notFound, unauthorized, forbidden } from '@/lib/openapi-responses';
import { AppEnv } from '@/types/app';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	ScholarshipProgramsOffsetQuerySchema,
	ScholarshipProgramsOffsetResponseSchema,
	ScholarshipProgramsCursorQuerySchema,
	ScholarshipProgramsCursorResponseSchema,
	ScholarshipProgramParamsSchema,
	ScholarshipProgramResponseSchema,
	CreateScholarshipProgramSchema,
	UpdateScholarshipProgramSchema,
} from './scholarship_programs.schema';
import {
	listScholarshipPrograms,
	listScholarshipProgramsCursor,
	getScholarshipProgram,
	createScholarshipProgram,
	updateScholarshipProgram,
	deleteScholarshipProgram,
} from './scholarship_programs.handler';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';

export const listScholarshipProgramsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Scholarship Programs'],
	summary: 'List scholarship programs (offset pagination)',
	request: { query: ScholarshipProgramsOffsetQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: ScholarshipProgramsOffsetResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const listScholarshipProgramsCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Scholarship Programs'],
	summary: 'List scholarship programs (cursor pagination)',
	request: { query: ScholarshipProgramsCursorQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: ScholarshipProgramsCursorResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const getScholarshipProgramRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Scholarship Programs'],
	summary: 'Get scholarship program by ID',
	request: { params: ScholarshipProgramParamsSchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: ScholarshipProgramResponseSchema },
			},
			description: 'OK',
		},
		404: notFound,
	},
});

export const createScholarshipProgramRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Scholarship Programs'],
	summary: 'Create a scholarship program (admin/personnel only)',
	request: {
		body: {
			content: {
				'application/json': { schema: CreateScholarshipProgramSchema },
			},
			required: true,
		},
	},
	responses: {
		201: {
			content: {
				'application/json': { schema: ScholarshipProgramResponseSchema },
			},
			description: 'Created',
		},
		401: unauthorized,
		403: forbidden,
	},
});

export const updateScholarshipProgramRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Scholarship Programs'],
	summary: 'Update a scholarship program (admin/personnel only)',
	request: {
		params: ScholarshipProgramParamsSchema,
		body: {
			content: {
				'application/json': { schema: UpdateScholarshipProgramSchema },
			},
			required: true,
		},
	},
	responses: {
		200: {
			content: {
				'application/json': { schema: ScholarshipProgramResponseSchema },
			},
			description: 'OK',
		},
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteScholarshipProgramRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Scholarship Programs'],
	summary: 'Delete a scholarship program (admin/personnel only)',
	request: { params: ScholarshipProgramParamsSchema },
	responses: {
		204: { description: 'Deleted' },
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const scholarshipProgramsRoute = new OpenAPIHono<AppEnv>();

scholarshipProgramsRoute.use('/*', requireAuth, requireRole('personnel'));
scholarshipProgramsRoute.openapi(
	listScholarshipProgramsRoute,
	listScholarshipPrograms,
);
scholarshipProgramsRoute.openapi(
	listScholarshipProgramsCursorRoute,
	listScholarshipProgramsCursor,
);
scholarshipProgramsRoute.openapi(
	getScholarshipProgramRoute,
	getScholarshipProgram,
);
scholarshipProgramsRoute.openapi(
	createScholarshipProgramRoute,
	createScholarshipProgram,
);
scholarshipProgramsRoute.openapi(
	updateScholarshipProgramRoute,
	updateScholarshipProgram,
);
scholarshipProgramsRoute.openapi(
	deleteScholarshipProgramRoute,
	deleteScholarshipProgram,
);

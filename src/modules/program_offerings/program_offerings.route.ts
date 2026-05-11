import { notFound, unauthorized, forbidden } from '@/lib/openapi-responses';
import { AppEnv } from '@/types/app';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	ProgramOfferingsOffsetQuerySchema,
	ProgramOfferingsOffsetResponseSchema,
	ProgramOfferingsCursorQuerySchema,
	ProgramOfferingsCursorResponseSchema,
	ProgramOfferingParamsSchema,
	ProgramOfferingResponseSchema,
	CreateProgramOfferingSchema,
	UpdateProgramOfferingSchema,
} from './program_offerings.schema';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';
import {
	listProgramOfferings,
	listProgramOfferingsCursor,
	getProgramOffering,
	createProgramOffering,
	updateProgramOffering,
	deleteProgramOffering,
} from './program_offertings.handler';

export const listProgramOfferingsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Program Offerings'],
	summary: 'List program offerings (offset pagination)',
	request: { query: ProgramOfferingsOffsetQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: ProgramOfferingsOffsetResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const listProgramOfferingsCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Program Offerings'],
	summary: 'List program offerings (cursor pagination)',
	request: { query: ProgramOfferingsCursorQuerySchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: ProgramOfferingsCursorResponseSchema },
			},
			description: 'OK',
		},
	},
});

export const getProgramOfferingRoute = createRoute({
	method: 'get',
	path: '/{id}',
	tags: ['Program Offerings'],
	summary: 'Get program offering by ID',
	request: { params: ProgramOfferingParamsSchema },
	responses: {
		200: {
			content: {
				'application/json': { schema: ProgramOfferingResponseSchema },
			},
			description: 'OK',
		},
		404: notFound,
	},
});

export const createProgramOfferingRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Program Offerings'],
	summary: 'Create a program offering (admin/personnel only)',
	request: {
		body: {
			content: {
				'application/json': { schema: CreateProgramOfferingSchema },
			},
			required: true,
		},
	},
	responses: {
		201: {
			content: {
				'application/json': { schema: ProgramOfferingResponseSchema },
			},
			description: 'Created',
		},
		401: unauthorized,
		403: forbidden,
	},
});

export const updateProgramOfferingRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Program Offerings'],
	summary: 'Update a program offering (admin/personnel only)',
	request: {
		params: ProgramOfferingParamsSchema,
		body: {
			content: {
				'application/json': { schema: UpdateProgramOfferingSchema },
			},
			required: true,
		},
	},
	responses: {
		200: {
			content: {
				'application/json': { schema: ProgramOfferingResponseSchema },
			},
			description: 'OK',
		},
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteProgramOfferingRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Program Offerings'],
	summary: 'Delete a program offering (admin/personnel only)',
	request: { params: ProgramOfferingParamsSchema },
	responses: {
		204: { description: 'Deleted' },
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const programOfferingsRoute = new OpenAPIHono<AppEnv>();

programOfferingsRoute.openapi(listProgramOfferingsRoute, listProgramOfferings);
programOfferingsRoute.openapi(
	listProgramOfferingsCursorRoute,
	listProgramOfferingsCursor,
);
programOfferingsRoute.openapi(getProgramOfferingRoute, getProgramOffering);

programOfferingsRoute.use('/*', requireAuth, requireRole('personnel'));
programOfferingsRoute.openapi(
	createProgramOfferingRoute,
	createProgramOffering,
);
programOfferingsRoute.openapi(
	updateProgramOfferingRoute,
	updateProgramOffering,
);
programOfferingsRoute.openapi(
	deleteProgramOfferingRoute,
	deleteProgramOffering,
);

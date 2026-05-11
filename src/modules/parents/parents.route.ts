import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	CreateParentSchema,
	ParentParamsSchema,
	ParentResponseSchema,
	ParentsCursorQuerySchema,
	ParentsCursorResponseSchema,
	ParentsOffsetQuerySchema,
	ParentsOffsetResponseSchema,
	UpdateParentSchema,
} from './parents.schema';
import { unauthorized, forbidden, notFound } from '@/lib/openapi-responses';
import { AppEnv } from '@/types/app';
import {
	createParent,
	deleteParent,
	getParent,
	listParents,
	listParentsCursor,
	updateParent,
} from './parents.handler';
import { requireAuth } from '@/middleware/require-auth';
import { requireRole } from '@/middleware/require-role';

export const listParentsRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Parents'],
	summary: 'List parents (offset pagination)',
	request: { query: ParentsOffsetQuerySchema },
	responses: {
		200: {
			content: { 'application/json': { schema: ParentsOffsetResponseSchema } },
			description: 'OK',
		},
	},
});

export const listParentsCursorRoute = createRoute({
	method: 'get',
	path: '/cursor',
	tags: ['Parents'],
	summary: 'List parents (cursor pagination)',
	request: { query: ParentsCursorQuerySchema },
	responses: {
		200: {
			content: { 'application/json': { schema: ParentsCursorResponseSchema } },
			description: 'OK',
		},
	},
});

export const getParentRoute = createRoute({
	method: 'get',
	path: '/:id',
	tags: ['Parents'],
	summary: 'Get parent by id',
	request: { params: ParentParamsSchema },
	responses: {
		200: {
			content: { 'application/json': { schema: ParentResponseSchema } },
			description: 'OK',
		},
	},
});

export const createParentRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Parents'],
	summary: 'Create a new parent',
	request: {
		body: {
			content: { 'application/json': { schema: CreateParentSchema } },
			required: true,
		},
	},
	responses: {
		201: {
			content: { 'application/json': { schema: ParentResponseSchema } },
			description: 'Created',
		},
		401: unauthorized,
		403: forbidden,
	},
});

export const updateParentRoute = createRoute({
	method: 'put',
	path: '/{id}',
	tags: ['Parents'],
	summary: 'Update a parent',
	request: {
		params: ParentParamsSchema,
		body: {
			content: { 'application/json': { schema: UpdateParentSchema } },
			required: true,
		},
	},
	responses: {
		200: {
			content: { 'application/json': { schema: ParentResponseSchema } },
			description: 'OK',
		},
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const deleteParentRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Parents'],
	summary: 'Delete a parent',
	request: { params: ParentParamsSchema },
	responses: {
		204: { description: 'Deleted' },
		401: unauthorized,
		403: forbidden,
		404: notFound,
	},
});

export const parentsRoute = new OpenAPIHono<AppEnv>();

parentsRoute.openapi(createParentRoute, createParent);
parentsRoute.openapi(updateParentRoute, updateParent);
parentsRoute.openapi(deleteParentRoute, deleteParent);

parentsRoute.use('/*', requireAuth, requireRole('personnel'));
parentsRoute.openapi(listParentsRoute, listParents);
parentsRoute.openapi(listParentsCursorRoute, listParentsCursor);
parentsRoute.openapi(getParentRoute, getParent);

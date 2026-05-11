import { createCursorMeta, createOffsetMeta } from '@/lib/pagination';
import { createParentsRepo } from '@/repositories/parents.repo';
import { createParentsService } from '@/services/parents.service';
import { AppEnv } from '@/types/app';
import { RouteHandler } from '@hono/zod-openapi';
import { Context } from 'hono';
import {
	createParentRoute,
	deleteParentRoute,
	getParentRoute,
	listParentsCursorRoute,
	listParentsRoute,
	updateParentRoute,
} from './parents.route';

const getParentsService = (c: Context<AppEnv>) =>
	createParentsService(createParentsRepo(c.get('db')));

export const listParents: RouteHandler<
	typeof listParentsRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getParentsService(c);
	const { rows, total } = await service.listOffset({
		page,
		perPage,
		search,
		sortField: sort,
		sortOrder: order,
	});
	return c.json(
		{
			data: rows,
			meta: createOffsetMeta({ total, perPage, page }),
		},
		200,
	);
};

export const listParentsCursor: RouteHandler<
	typeof listParentsCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getParentsService(c);
	const { rows, nextCursor, prevCursor, hasNext, hasPrev } =
		await service.listCursor({
			cursor: cursor ?? null,
			perPage,
			direction,
		});

	return c.json(
		{
			data: rows,
			meta: createCursorMeta({
				nextCursor,
				prevCursor,
				hasNext,
				hasPrev,
				perPage,
			}),
		},
		200,
	);
};

export const getParent: RouteHandler<typeof getParentRoute, AppEnv> = async (
	c,
) => {
	const { id } = c.req.valid('param');
	const service = getParentsService(c);
	const parent = await service.getById(id);

	return c.json(parent, 200);
};

export const createParent: RouteHandler<
	typeof createParentRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const service = getParentsService(c);
	const parent = await service.create(body);

	return c.json(parent, 201);
};

export const updateParent: RouteHandler<
	typeof updateParentRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = c.req.valid('json');
	const service = getParentsService(c);
	const parent = await service.update(id, body);

	return c.json(parent, 200);
};

export const deleteParent: RouteHandler<
	typeof deleteParentRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getParentsService(c);

	await service.delete(id);

	return c.body(null, 204);
};

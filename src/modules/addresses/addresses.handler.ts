import { createOffsetMeta, createCursorMeta } from '@/lib/pagination';
import { createAddressesRepo } from '@/repositories/adresses.repo';
import { createAddressesService } from '@/services/addresses.service';
import { AppEnv } from '@/types/app';
import { RouteHandler } from '@hono/zod-openapi';
import { Context } from 'hono';
import {
	listAddressesRoute,
	listAddressesCursorRoute,
	getAddressRoute,
	createAddressRoute,
	updateAddressRoute,
	deleteAddressRoute,
} from './addresses.route';

const getAddressesService = (c: Context<AppEnv>) =>
	createAddressesService(createAddressesRepo(c.get('db')));

export const listAddresses: RouteHandler<
	typeof listAddressesRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getAddressesService(c);
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
			meta: createOffsetMeta({ total, page, perPage }),
		},
		200,
	);
};

export const listAddressesCursor: RouteHandler<
	typeof listAddressesCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getAddressesService(c);
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

export const getAddress: RouteHandler<typeof getAddressRoute, AppEnv> = async (
	c,
) => {
	const { id } = c.req.valid('param');
	const service = getAddressesService(c);
	const address = await service.getById(id);

	return c.json(address, 200);
};

export const createAddress: RouteHandler<
	typeof createAddressRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const service = getAddressesService(c);
	const address = await service.create(body);

	return c.json(address, 201);
};

export const updateAddress: RouteHandler<
	typeof updateAddressRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = c.req.valid('json');
	const service = getAddressesService(c);
	const address = await service.update(id, body);

	return c.json(address, 200);
};

export const deleteAddress: RouteHandler<
	typeof deleteAddressRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getAddressesService(c);

	await service.delete(id);

	return c.body(null, 204);
};

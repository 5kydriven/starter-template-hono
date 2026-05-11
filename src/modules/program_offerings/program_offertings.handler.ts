import { createOffsetMeta, createCursorMeta } from '@/lib/pagination';
import { createProgramOfferingsRepo } from '@/repositories/program_offerings';
import { createProgramOfferingsService } from '@/services/program_offerings.service';
import { AppEnv } from '@/types/app';
import { RouteHandler } from '@hono/zod-openapi';
import { Context } from 'hono';
import {
	listProgramOfferingsRoute,
	listProgramOfferingsCursorRoute,
	getProgramOfferingRoute,
	createProgramOfferingRoute,
	updateProgramOfferingRoute,
	deleteProgramOfferingRoute,
} from './program_offerings.route';

const getProgramOfferingsService = (c: Context<AppEnv>) =>
	createProgramOfferingsService(createProgramOfferingsRepo(c.get('db')));

export const listProgramOfferings: RouteHandler<
	typeof listProgramOfferingsRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getProgramOfferingsService(c);
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

export const listProgramOfferingsCursor: RouteHandler<
	typeof listProgramOfferingsCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getProgramOfferingsService(c);
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

export const getProgramOffering: RouteHandler<
	typeof getProgramOfferingRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getProgramOfferingsService(c);
	const programOffering = await service.getById(id);

	return c.json(programOffering, 200);
};

export const createProgramOffering: RouteHandler<
	typeof createProgramOfferingRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const service = getProgramOfferingsService(c);
	const programOffering = await service.create(body);

	return c.json(programOffering, 201);
};

export const updateProgramOffering: RouteHandler<
	typeof updateProgramOfferingRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = c.req.valid('json');
	const service = getProgramOfferingsService(c);
	const programOffering = await service.update(id, body);

	return c.json(programOffering, 200);
};

export const deleteProgramOffering: RouteHandler<
	typeof deleteProgramOfferingRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getProgramOfferingsService(c);

	await service.softDelete(id);

	return c.body(null, 204);
};

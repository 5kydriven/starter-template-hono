import { createOffsetMeta, createCursorMeta } from '@/lib/pagination';
import { createScholarshipProgramsRepo } from '@/repositories/scholarship_programs.repo';
import { createScholarshipProgramsService } from '@/services/scholarship_programs.service';
import { AppEnv } from '@/types/app';
import { RouteHandler } from '@hono/zod-openapi';
import {
	listScholarshipProgramsRoute,
	listScholarshipProgramsCursorRoute,
	getScholarshipProgramRoute,
	createScholarshipProgramRoute,
	updateScholarshipProgramRoute,
	deleteScholarshipProgramRoute,
} from './scholarship_programs.route';
import { Context } from 'hono';

const getScholarshipProgramsService = (c: Context<AppEnv>) =>
	createScholarshipProgramsService(createScholarshipProgramsRepo(c.get('db')));

export const listScholarshipPrograms: RouteHandler<
	typeof listScholarshipProgramsRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getScholarshipProgramsService(c);
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

export const listScholarshipProgramsCursor: RouteHandler<
	typeof listScholarshipProgramsCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getScholarshipProgramsService(c);
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

export const getScholarshipProgram: RouteHandler<
	typeof getScholarshipProgramRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getScholarshipProgramsService(c);
	const scholarshipProgram = await service.getById(id);

	return c.json(scholarshipProgram, 200);
};

export const createScholarshipProgram: RouteHandler<
	typeof createScholarshipProgramRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const service = getScholarshipProgramsService(c);
	const scholarshipProgram = await service.create(body);

	return c.json(scholarshipProgram, 201);
};

export const updateScholarshipProgram: RouteHandler<
	typeof updateScholarshipProgramRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = c.req.valid('json');
	const service = getScholarshipProgramsService(c);
	const scholarshipProgram = await service.update(id, body);

	return c.json(scholarshipProgram, 200);
};

export const deleteScholarshipProgram: RouteHandler<
	typeof deleteScholarshipProgramRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getScholarshipProgramsService(c);

	await service.softDelete(id);

	return c.body(null, 204);
};

import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { createCursorMeta, createOffsetMeta } from '@/lib/pagination';
import { createCoursesRepo } from '@/repositories/courses.repo';
import { createCoursesService } from '@/services/courses.service';
import type { AppEnv } from '@/types/app';
import type {
	createCourseRoute,
	deleteCourseRoute,
	getCourseRoute,
	listCoursesCursorRoute,
	listCoursesRoute,
	updateCourseRoute,
} from './courses.route';

const getCoursesService = (c: Context<AppEnv>) =>
	createCoursesService(createCoursesRepo(c.get('db')));

export const listCourses: RouteHandler<
	typeof listCoursesRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getCoursesService(c);
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

export const listCoursesCursor: RouteHandler<
	typeof listCoursesCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getCoursesService(c);
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

export const getCourse: RouteHandler<typeof getCourseRoute, AppEnv> = async (
	c,
) => {
	const { id } = c.req.valid('param');
	const service = getCoursesService(c);
	const course = await service.getById(id);

	return c.json(course, 200);
};

export const createCourse: RouteHandler<
	typeof createCourseRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const service = getCoursesService(c);
	const course = await service.create(body);

	return c.json(course, 201);
};

export const updateCourse: RouteHandler<
	typeof updateCourseRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = c.req.valid('json');
	const service = getCoursesService(c);
	const course = await service.update(id, body);

	return c.json(course, 200);
};

export const deleteCourse: RouteHandler<
	typeof deleteCourseRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getCoursesService(c);

	await service.delete(id);

	return c.body(null, 204);
};

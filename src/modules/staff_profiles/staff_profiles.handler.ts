import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { appendAuthHeaders } from '@/lib/auth-headers';
import { createStaffProfilesRepo } from '@/repositories/staff_profiles.repo';
import { createStaffProfilesService } from '@/services/staff_profiles.service';
import type { AppEnv } from '@/types/app';
import type {
	createStaffProfileRoute,
	deleteStaffProfileRoute,
	getStaffProfileRoute,
	listStaffProfilesCursorRoute,
	listStaffProfilesRoute,
	updateStaffProfileRoute,
} from './staff_profiles.route';
import { createCursorMeta, createOffsetMeta } from '@/lib/pagination';

const getStaffProfilesService = (c: Context<AppEnv>) =>
	createStaffProfilesService(createStaffProfilesRepo(c.get('db')));

export const createStaffProfile: RouteHandler<
	typeof createStaffProfileRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const auth = c.get('auth');
	const service = getStaffProfilesService(c);

	const result = await auth.api.signUpEmail({
		body: {
			name: body.firstName + ' ' + body.lastName,
			email: body.email,
			password: body.password,
		},
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	appendAuthHeaders(result.headers, c);

	const createdUser = result.response.user;
	const { profile } = await service.create({
		userId: createdUser.id,
		name: createdUser.name,
		email: createdUser.email,
		firstName: body.firstName,
		lastName: body.lastName,
		department: body.department,
		position: body.position,
		contactNumber: body.contactNumber,
	});

	return c.json(profile, 201);
};

export const listStaffProfiles: RouteHandler<
	typeof listStaffProfilesRoute,
	AppEnv
> = async (c) => {
	const { page, perPage, search, sort, order } = c.req.valid('query');
	const service = getStaffProfilesService(c);
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

export const getStaffProfile: RouteHandler<
	typeof getStaffProfileRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getStaffProfilesService(c);
	const profile = await service.getById(id);

	return c.json(profile, 200);
};

export const updateStaffProfile: RouteHandler<
	typeof updateStaffProfileRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const body = c.req.valid('json');
	const service = getStaffProfilesService(c);
	const profile = await service.update(id, body);

	return c.json(profile, 200);
};

export const deleteStaffProfile: RouteHandler<
	typeof deleteStaffProfileRoute,
	AppEnv
> = async (c) => {
	const { id } = c.req.valid('param');
	const service = getStaffProfilesService(c);

	await service.delete(id);

	return c.body(null, 204);
};

export const listStaffProfilesCursor: RouteHandler<
	typeof listStaffProfilesCursorRoute,
	AppEnv
> = async (c) => {
	const { cursor, perPage, direction } = c.req.valid('query');
	const service = getStaffProfilesService(c);
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

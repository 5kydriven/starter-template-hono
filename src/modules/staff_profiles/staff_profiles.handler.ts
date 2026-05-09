import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { appendAuthHeaders } from '@/lib/auth-headers';
import { createStaffProfilesRepo } from '@/repositories/staff_profiles.repo';
import { createStaffProfilesService } from '@/services/staff_profiles.service';
import type { AppEnv } from '@/types/app';
import type { createStaffProfileRoute } from './staff_profiles.route';

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
	const { user, staffProfile } = await service.create({
		userId: createdUser.id,
		name: createdUser.name,
		email: createdUser.email,
		firstName: body.firstName,
		lastName: body.lastName,
		department: body.department,
		position: body.position,
		contactNumber: body.contactNumber,
	});

	return c.json({ user, staffProfile }, 201);
};

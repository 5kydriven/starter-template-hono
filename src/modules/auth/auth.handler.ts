import type { RouteHandler } from '@hono/zod-openapi';
import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { appendAuthHeaders } from '@/lib/auth-headers';
import { isUserRole } from '@/constants/roles';
import { Errors } from '@/lib/errors';
import { normalizeStudentNumber } from '@/lib/student-number';
import { createStudentAllowlistsRepo } from '@/repositories/student_allowlists.repo';
import { createStudentsRepo } from '@/repositories/students.repo';
import { createStudentAllowlistService } from '@/services/student_allowlist.service';
import { createStudentsService } from '@/services/students.service';
import type { AppEnv } from '@/types/app';
import type {
	loginRoute,
	logoutRoute,
	meRoute,
	studentLoginRoute,
	studentRegisterRoute,
	studentVerifyRoute,
} from './auth.route';

const getStudentAllowlistService = (c: Context<AppEnv>) =>
	createStudentAllowlistService(createStudentAllowlistsRepo(c.get('db')));

const getStudentsService = (c: Context<AppEnv>) =>
	createStudentsService(createStudentsRepo(c.get('db')));

const toAuthUser = (user: {
	id: string;
	name: string;
	email: string;
	role?: string | null;
}) => {
	const role = isUserRole(user.role) ? user.role : 'student';

	return {
		id: user.id,
		name: user.name,
		email: user.email,
		role,
	};
};

export const login: RouteHandler<typeof loginRoute, AppEnv> = async (c) => {
	const body = c.req.valid('json');
	const auth = c.get('auth');

	const result = await auth.api.signInEmail({
		body,
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	appendAuthHeaders(result.headers, c);

	return c.json(
		{
			user: toAuthUser(result.response.user),
		},
		200,
	);
};

export const studentVerify: RouteHandler<
	typeof studentVerifyRoute,
	AppEnv
> = async (c) => {
	const { studentNumber } = c.req.valid('query');
	const normalizedStudentNumber = normalizeStudentNumber(studentNumber);
	const allowlistService = getStudentAllowlistService(c);
	const allowlist = await allowlistService.verify(normalizedStudentNumber);

	if (!allowlist) {
		return c.json(
			{
				allowed: false,
				isRegistered: false,
				nextAction: 'denied',
				student: null,
			},
			200,
		);
	}

	return c.json(
		{
			allowed: true,
			isRegistered: allowlist.isRegistered,
			nextAction: allowlist.isRegistered ? 'login' : 'register',
			student: {
				studentNumber: allowlist.studentNumber,
				name: allowlist.name,
			},
		},
		200,
	);
};

export const studentRegister: RouteHandler<
	typeof studentRegisterRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const normalizedStudentNumber = normalizeStudentNumber(body.studentNumber);
	const auth = c.get('auth');
	const allowlistService = getStudentAllowlistService(c);
	const studentsService = getStudentsService(c);

	const allowlist = await allowlistService.verify(normalizedStudentNumber);
	if (!allowlist) {
		throw Errors.validation([
			{
				field: 'studentNumber',
				message: 'Student number is not in the allowlist',
			},
		]);
	}

	if (allowlist.isRegistered) {
		throw Errors.conflict('Student number is already registered');
	}

	const existingStudent = await studentsService.findByStudentNumber(
		normalizedStudentNumber,
	);
	if (existingStudent) {
		throw Errors.conflict('Student number is already registered');
	}

	const result = await auth.api.signUpEmail({
		body: {
			name: allowlist.name ?? normalizedStudentNumber,
			email: body.email,
			password: body.password,
		},
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	const createdUser = result.response.user;
	let createdStudent:
		| Awaited<ReturnType<typeof studentsService.create>>
		| undefined;

	try {
		createdStudent = await studentsService.create({
			userId: createdUser.id,
			studentNumber: normalizedStudentNumber,
			name: allowlist.name ?? normalizedStudentNumber,
			email: createdUser.email,
		});
		await allowlistService.markRegistered(normalizedStudentNumber);
	} catch (err) {
		if (createdStudent) {
			await studentsService.delete(createdStudent.id).catch((cleanupErr) => {
				console.error('[student-register-cleanup]', cleanupErr);
			});
		}
		await studentsService.deleteUser(createdUser.id).catch((cleanupErr) => {
			console.error('[student-register-cleanup]', cleanupErr);
		});
		throw err;
	}

	return c.json(
		{
			studentNumber: createdStudent.studentNumber,
			name: createdStudent.name,
			email: createdStudent.email,
		},
		200,
	);
};

export const studentLogin: RouteHandler<
	typeof studentLoginRoute,
	AppEnv
> = async (c) => {
	const body = c.req.valid('json');
	const normalizedStudentNumber = normalizeStudentNumber(body.studentNumber);
	const auth = c.get('auth');
	const studentsService = getStudentsService(c);
	const student = await studentsService.findByStudentNumber(
		normalizedStudentNumber,
	);

	if (!student) {
		throw Errors.unauthorized('Invalid student number or password');
	}

	const result = await auth.api.signInEmail({
		body: {
			email: student.email,
			password: body.password,
		},
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	appendAuthHeaders(result.headers, c);

	return c.json(
		{
			studentNumber: student.studentNumber,
			name: student.name,
			email: student.email,
		},
		200,
	);
};

export const logout: RouteHandler<typeof logoutRoute, AppEnv> = async (c) => {
	const auth = c.get('auth');

	const result = await auth.api.signOut({
		headers: c.req.raw.headers,
		returnHeaders: true,
	});

	appendAuthHeaders(result.headers, c);

	return c.json(result.response, 200);
};

export const me: RouteHandler<typeof meRoute, AppEnv> = async (c) => {
	const user = c.get('user');
	const session = c.get('session');

	if (!user || !session) {
		throw new HTTPException(401, {
			message: 'Unauthorized',
		});
	}

	return c.json(
		{
			user,
			session: {
				id: session.id,
				userId: session.userId,
				expiresAt: session.expiresAt.toISOString(),
			},
		},
		200,
	);
};

import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { APIError } from 'better-auth/api';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import type { ErrorCode } from '@/constants/error-codes';

const toContentfulStatusCode = (status: number): ContentfulStatusCode =>
	status as ContentfulStatusCode;

const httpErrorCode = (status: number): ErrorCode => {
	switch (status) {
		case 400:
			return 'VALIDATION_ERROR';
		case 401:
			return 'UNAUTHORIZED';
		case 403:
			return 'FORBIDDEN';
		case 404:
			return 'NOT_FOUND';
		case 409:
			return 'CONFLICT';
		case 422:
			return 'VALIDATION_ERROR';
		case 429:
			return 'RATE_LIMITED';
		default:
			return 'INTERNAL_ERROR';
	}
};

export const errorHandler: ErrorHandler = (err, c) => {
	if (err instanceof AppError) {
		return c.json(
			{ error: { code: err.code, message: err.message, details: err.details } },
			toContentfulStatusCode(err.statusCode),
		);
	}

	if (err instanceof HTTPException) {
		return c.json(
			{
				error: {
					code: httpErrorCode(err.status),
					message: err.message,
					details: [],
				},
			},
			err.status,
		);
	}

	if (err instanceof APIError) {
		return c.json(
			{
				error: {
					code: err.body?.code ?? 'UNAUTHORIZED',
					message: err.body?.message ?? err.message,
					details: [],
				},
			},
			toContentfulStatusCode(err.statusCode),
		);
	}

	if (err instanceof ZodError) {
		const details = err.issues.map((i) => ({
			field: i.path.join('.'),
			message: i.message,
		}));
		return c.json(
			{
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details,
				},
			},
			422,
		);
	}

	console.error('[error]', err);
	return c.json(
		{
			error: {
				code: 'INTERNAL_ERROR',
				message: 'An unexpected error occurred',
				details: [],
			},
		},
		500,
	);
};

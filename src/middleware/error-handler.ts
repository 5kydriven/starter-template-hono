import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { APIError } from 'better-auth/api';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';

export const errorHandler: ErrorHandler = (err, c) => {
	if (err instanceof AppError) {
		return c.json(
			{ error: { code: err.code, message: err.message, details: err.details } },
			err.statusCode as any,
		);
	}

	if (err instanceof HTTPException) {
		return c.json(
			{
				error: {
					code: err.status === 401 ? 'UNAUTHORIZED' : 'INTERNAL_ERROR',
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
			err.statusCode as any,
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

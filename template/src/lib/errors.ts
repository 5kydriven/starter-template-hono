import type { ErrorCode } from '@/constants/error-codes';

export class AppError extends Error {
	constructor(
		public statusCode: number,
		public code: ErrorCode,
		message: string,
		public details: { field?: string; message: string }[] = [],
	) {
		super(message);
		this.name = 'AppError';
	}
}

// Typed constructors — use these instead of new AppError() directly
export const Errors = {
	notFound: (message = 'Resource not found') =>
		new AppError(404, 'NOT_FOUND', message),

	unauthorized: (message = 'Missing or invalid token') =>
		new AppError(401, 'UNAUTHORIZED', message),

	forbidden: (required?: string) =>
		new AppError(
			403,
			'FORBIDDEN',
			required ? `Insufficient role. Required: ${required}` : 'Forbidden',
		),

	conflict: (message: string) => new AppError(409, 'CONFLICT', message),

	validation: (details: { field: string; message: string }[]) =>
		new AppError(422, 'VALIDATION_ERROR', 'Request validation failed', details),

	internal: (message = 'An unexpected error occurred') =>
		new AppError(500, 'INTERNAL_ERROR', message),
};

type AppErrorDetail = {
	field?: string;
	message: string;
};

export class AppError extends Error {
	constructor(
		public statusCode: number,
		public code: string,
		message: string,
		public details: AppErrorDetail[] = [],
	) {
		super(message);
		this.name = 'AppError';
	}
}

export const Errors = {
	unauthorized: (message = 'Missing or invalid token') =>
		new AppError(401, 'UNAUTHORIZED', message),
	forbidden: (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message),
};

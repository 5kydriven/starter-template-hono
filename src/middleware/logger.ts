import type { MiddlewareHandler } from 'hono';

export const logger = (): MiddlewareHandler => async (c, next) => {
	const start = Date.now();
	const method = c.req.method;
	const path = new URL(c.req.url).pathname;
	const requestId = c.get('requestId') ?? '-';

	await next();

	const ms = Date.now() - start;
	const status = c.res.status;
	console.log(`[${requestId}] ${method} ${path} ${status} ${ms}ms`);
};

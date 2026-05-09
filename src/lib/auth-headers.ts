import type { Context } from 'hono';
import type { AppEnv } from '@/types/app';

export const appendAuthHeaders = (headers: Headers, c: Context<AppEnv>) => {
	headers.forEach((value, key) => {
		if (key.toLowerCase() === 'set-cookie') {
			c.header('Set-Cookie', value, { append: true });
			return;
		}

		c.header(key, value);
	});
};

import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { hasRole, type UserRole } from '@/constants/roles';
import type { AppEnv } from '../types/app';

export const requireRole = (
	minimumRole: UserRole,
): MiddlewareHandler<AppEnv> => {
	return async (c, next) => {
		const user = c.get('user');

		if (!user) {
			throw new HTTPException(401, {
				message: 'Unauthorized',
			});
		}

		if (!hasRole(user.role, minimumRole)) {
			throw new HTTPException(403, {
				message: `Insufficient role. Required: ${minimumRole}`,
			});
		}

		await next();
	};
};

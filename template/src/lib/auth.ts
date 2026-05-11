import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Db } from '../db';
import { account, session, user, verification } from '../db/schema/auth';

export const createAuth = (db: Db, env: CloudflareBindings) => {
	return betterAuth({
		secret: env.BETTER_AUTH_SECRET,
		baseURL: env.BETTER_AUTH_URL,

		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: {
				user,
				session,
				account,
				verification,
			},
		}),

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},

		user: {
			additionalFields: {
				role: {
					type: 'string',
					required: false,
					defaultValue: 'member',
					input: false,
				},
			},
		},

		trustedOrigins: [env.CORS_ORIGIN],
	});
};

export type Auth = ReturnType<typeof createAuth>;

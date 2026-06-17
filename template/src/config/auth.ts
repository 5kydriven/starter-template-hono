import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { account, session, user, verification } from '../db/schema/auth';
import { hashPassword, verifyPassword } from '@/utils/crypto';
import { bearer } from 'better-auth/plugins';
import type { Env } from '@/types/env';
import { db } from '@/db';

export const createAuth = (env: Env) => {
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
		plugins: [bearer()],
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
			autoSignIn: false,
			// for free plan clouflare cpu limit
			password: {
				hash: hashPassword,
				verify: async ({ hash, password }) => verifyPassword(hash, password),
			},
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
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
		},
		trustedOrigins: [env.CORS_ORIGIN],
	});
};

export type Auth = ReturnType<typeof createAuth>;

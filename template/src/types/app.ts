import type { Db } from '@/db';
import type { Auth } from '../lib/auth';

export type UserRole = 'admin' | 'editor' | 'member' | 'viewer';

export type AppBindings = {
	DATABASE_URL: string;
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	CORS_ORIGIN: string;
};

export type AppVariables = {
	db: Db;
	auth: Auth;
	user: {
		id: string;
		email: string;
		name: string;
		role: UserRole;
	} | null;
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
	} | null;
};

export type AppEnv = {
	Bindings: AppBindings;
	Variables: AppVariables;
};

import type { Env } from '@/types/env';
import type { DB } from '@/db';
import type { Auth } from './auth';

type AuthContext = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;

export type AppBindings = {
	Bindings: Env;
	Variables: {
		db: DB;
		auth: Auth;
		user: AuthContext['user'];
		session: AuthContext['session'];
	};
};

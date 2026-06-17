import type { Env } from '@/types/env';
import type { Auth } from './auth';

type AuthContext = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;

export type AppBindings = {
	Bindings: Env;
	Variables: {
		auth: Auth;
		user: AuthContext['user'];
		session: AuthContext['session'];
	};
};

export interface Env {
	DATABASE_URL: string;
	JWT_SECRET: string;
	JWT_EXPIRES_IN: string;
	NODE_ENV: string;
	CORS_ORIGIN: string;
	KV: KVNamespace;
}

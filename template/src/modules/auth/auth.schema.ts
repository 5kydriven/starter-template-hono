import { z } from '@hono/zod-openapi';

export const RegisterSchema = z.object({
	name: z.string().min(1).max(100).openapi({ example: 'Maria Santos' }),
	email: z.email().openapi({ example: 'maria@example.com' }),
	password: z.string().min(8).openapi({ example: 'supersecret123' }),
});

export const LoginSchema = z.object({
	email: z.email().openapi({ example: 'maria@example.com' }),
	password: z.string().min(8).openapi({ example: 'supersecret123' }),
});

export const AuthUserSchema = z.object({
	id: z.string().openapi({ example: 'user_123' }),
	name: z.string().openapi({ example: 'Maria Santos' }),
	email: z.email().openapi({ example: 'maria@example.com' }),
	role: z.enum(['admin', 'editor', 'member', 'viewer']).openapi({
		example: 'member',
	}),
});

export const AuthResponseSchema = z.object({
	user: AuthUserSchema,
});

export const SessionResponseSchema = z.object({
	id: z.string().openapi({ example: 'session_123' }),
	userId: z.string().openapi({ example: 'user_123' }),
	expiresAt: z.string().openapi({ example: '2026-05-05T12:00:00.000Z' }),
});

export const MeResponseSchema = z.object({
	user: AuthUserSchema,
	session: SessionResponseSchema,
});

export const LogoutResponseSchema = z.object({
	success: z.boolean().openapi({ example: true }),
});

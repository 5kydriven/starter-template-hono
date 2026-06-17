import { z } from '@hono/zod-openapi';

export const RegisterSchema = z
	.object({
		name: z.string().min(1).max(100).openapi({ example: 'Maria Santos' }),
		email: z.email().openapi({ example: 'maria@example.com' }),
		password: z.string().min(8).max(128).openapi({ example: 'password123' }),
	})
	.openapi('RegisterRequest');

export const LoginSchema = z
	.object({
		email: z.email().openapi({ example: 'maria@example.com' }),
		password: z.string().min(1).openapi({ example: 'password123' }),
	})
	.openapi('LoginRequest');

export const AuthUserSchema = z
	.object({
		id: z.string().openapi({ example: 'usr_123' }),
		name: z.string().openapi({ example: 'Maria Santos' }),
		email: z.email().openapi({ example: 'maria@example.com' }),
		emailVerified: z.boolean().openapi({ example: false }),
		image: z.string().nullable().optional().openapi({ example: null }),
		role: z.string().optional().openapi({ example: 'member' }),
		createdAt: z.iso
			.datetime()
			.openapi({ example: '2026-06-17T00:00:00.000Z' }),
		updatedAt: z.iso
			.datetime()
			.openapi({ example: '2026-06-17T00:00:00.000Z' }),
	})
	.openapi('AuthUser');

export const AuthSessionSchema = z
	.object({
		id: z.string().openapi({ example: 'ses_123' }),
		userId: z.string().openapi({ example: 'usr_123' }),
		token: z.string().openapi({ example: 'session-token' }),
		expiresAt: z.iso
			.datetime()
			.openapi({ example: '2026-06-24T00:00:00.000Z' }),
		ipAddress: z.string().nullable().optional().openapi({ example: null }),
		userAgent: z.string().nullable().optional().openapi({ example: null }),
		createdAt: z.iso
			.datetime()
			.openapi({ example: '2026-06-17T00:00:00.000Z' }),
		updatedAt: z.iso
			.datetime()
			.openapi({ example: '2026-06-17T00:00:00.000Z' }),
	})
	.openapi('AuthSession');

export const AuthTokenResponseSchema = z
	.object({
		user: AuthUserSchema,
		token: z.string().nullable().openapi({ example: 'session-token' }),
	})
	.openapi('AuthTokenResponse');

export const MeResponseSchema = z
	.object({
		user: AuthUserSchema,
		session: AuthSessionSchema,
	})
	.openapi('MeResponse');

export const LogoutResponseSchema = z
	.object({
		success: z.boolean().openapi({ example: true }),
	})
	.openapi('LogoutResponse');

export const ErrorResponseSchema = z
	.object({
		error: z.object({
			code: z.string().openapi({ example: 'UNAUTHORIZED' }),
			message: z.string().openapi({ example: 'Missing or invalid token' }),
			details: z.array(z.unknown()).openapi({ example: [] }),
		}),
	})
	.openapi('ErrorResponse');

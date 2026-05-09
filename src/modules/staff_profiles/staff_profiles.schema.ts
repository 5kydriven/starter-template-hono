import {
	CursorMetaSchema,
	CursorQuerySchema,
	OffsetMetaSchema,
	OffsetQuerySchema,
} from '@/lib/pagination';
import { z } from '@hono/zod-openapi';

export const StaffProfileParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateStaffProfileSchema = z.object({
	email: z.email().openapi({ example: 'juan.staff@example.com' }),
	password: z.string().min(8).openapi({ example: 'supersecret123' }),
	firstName: z.string().min(1).max(100).openapi({ example: 'Juan' }),
	lastName: z.string().min(1).max(100).openapi({ example: 'Dela Cruz' }),
	department: z.string().min(1).max(100).openapi({ example: 'Registrar' }),
	position: z.string().min(1).max(100).openapi({ example: 'Records Officer' }),
	contactNumber: z
		.string()
		.min(1)
		.max(50)
		.optional()
		.openapi({ example: '+639171234567' }),
});

export const StaffProfileUserSchema = z.object({
	id: z.string().openapi({ example: 'user_123' }),
	name: z.string().openapi({ example: 'Juan Dela Cruz' }),
	email: z.email().openapi({ example: 'juan.staff@example.com' }),
	role: z.literal('personnel').openapi({ example: 'personnel' }),
});

export const StaffProfileSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	userId: z.string().openapi({ example: 'user_123' }),
	firstName: z.string().openapi({ example: 'Juan' }),
	lastName: z.string().openapi({ example: 'Dela Cruz' }),
	department: z.string().openapi({ example: 'Registrar' }),
	position: z.string().openapi({ example: 'Records Officer' }),
	role: z
		.enum(['admin', 'personnel', 'student'])
		.openapi({ example: 'personnel' }),
	contactNumber: z.string().nullable().openapi({ example: '+639171234567' }),
	createdAt: z.string().openapi({ example: '2026-05-09T12:00:00.000Z' }),
	updatedAt: z.string().openapi({ example: '2026-05-09T12:00:00.000Z' }),
});

export const StaffProfilesOffsetResponseSchema = z.object({
	data: StaffProfileSchema.array(),
	meta: OffsetMetaSchema,
});

export const StaffProfilesCursorResponseSchema = z.object({
	data: StaffProfileSchema.array(),
	meta: CursorMetaSchema,
});

export const StaffProfilesOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'Juan' }),
	sort: z
		.enum(['firstName', 'lastName', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const StaffProfilesCursorQuerySchema = CursorQuerySchema;

export const UpdateStaffProfileSchema = CreateStaffProfileSchema.omit({
	email: true,
	password: true,
})
	.partial()
	.refine((value) => Object.keys(value).length > 0, {
		message: 'At least one staff profile field is required',
	});

export type UpdateStaffProfileInput = z.infer<typeof UpdateStaffProfileSchema>;

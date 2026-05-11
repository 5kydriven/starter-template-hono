import {
	CursorMetaSchema,
	CursorQuerySchema,
	OffsetMetaSchema,
	OffsetQuerySchema,
} from '@/lib/pagination';
import z from 'zod';

export const ParentParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateParentSchema = z.object({
	applicationId: z
		.uuid()
		.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	vitalStatus: z
		.enum(['living', 'deceased', 'unknown'])
		.openapi({ example: 'living' }),
	type: z.enum(['mother', 'father', 'guardian']).openapi({ example: 'father' }),
	firstName: z.string().min(2).max(100).openapi({ example: 'John' }),
	lastName: z.string().min(2).max(100).openapi({ example: 'Doe' }),
	middleName: z
		.string()
		.min(2)
		.max(100)
		.optional()
		.openapi({ example: 'John' }),
	extName: z.string().min(1).max(100).optional().openapi({ example: 'Jr.' }),
	occupation: z.string().min(2).max(100).openapi({ example: 'Engineer' }),
	monthlyIncome: z.string().min(1).max(100).openapi({ example: '5000' }),
});

export const UpdateParentSchema = CreateParentSchema.partial().refine(
	(v) => Object.keys(v).length > 0,
	{
		message: 'At least one parent field is required',
	},
);

export const ParentResponseSchema = z.object({
	id: z.uuid(),
	vitalStatus: z.enum(['living', 'deceased', 'unknown']),
	type: z.enum(['mother', 'father', 'guardian']),
	firstName: z.string(),
	lastName: z.string(),
	middleName: z.string().nullable(),
	extName: z.string().nullable(),
	occupation: z.string(),
	monthlyIncome: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const ParentsOffsetResponseSchema = z.object({
	data: ParentResponseSchema.array(),
	meta: OffsetMetaSchema,
});

export const ParentsCursorResponseSchema = z.object({
	data: ParentResponseSchema.array(),
	meta: CursorMetaSchema,
});

export const ParentsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'John' }),
	sort: z
		.enum(['firstName', 'lastName', 'middleName', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const ParentsCursorQuerySchema = CursorQuerySchema;

export type UpdateParentInput = z.infer<typeof UpdateParentSchema>;
export type CreateParentInput = z.infer<typeof CreateParentSchema>;

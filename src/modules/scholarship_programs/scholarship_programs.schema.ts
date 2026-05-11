import {
	OffsetMetaSchema,
	CursorMetaSchema,
	OffsetQuerySchema,
	CursorQuerySchema,
} from '@/lib/pagination';
import z from 'zod';

export const ScholarshipProgramParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateScholarshipProgramSchema = z.object({
	name: z.string().min(2).max(100).openapi({ example: 'TES' }),
	description: z
		.string()
		.optional()
		.openapi({ example: 'Scolarship Program....' }),
	isArchived: z.boolean().optional().default(false).openapi({ example: false }),
});

export const UpdateScholarshipProgramSchema =
	CreateScholarshipProgramSchema.partial().refine(
		(v) => Object.keys(v).length > 0,
		{
			message: 'At least one scholarship program field is required',
		},
	);

export const ScholarshipProgramResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	description: z.string().nullable(),
	isArchived: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const ScholarshipProgramsOffsetResponseSchema = z.object({
	data: ScholarshipProgramResponseSchema.array(),
	meta: OffsetMetaSchema,
});

export const ScholarshipProgramsCursorResponseSchema = z.object({
	data: ScholarshipProgramResponseSchema.array(),
	meta: CursorMetaSchema,
});

export const ScholarshipProgramsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'TES' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const ScholarshipProgramsCursorQuerySchema = CursorQuerySchema;

export type UpdateScholarshipProgramInput = z.infer<
	typeof UpdateScholarshipProgramSchema
>;
export type CreateScholarshipProgramInput = z.infer<
	typeof CreateScholarshipProgramSchema
>;

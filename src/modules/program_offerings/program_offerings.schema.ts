import {
	OffsetMetaSchema,
	CursorMetaSchema,
	OffsetQuerySchema,
	CursorQuerySchema,
} from '@/lib/pagination';
import z from 'zod';

export const ProgramOfferingParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateProgramOfferingSchema = z.object({
	scholarshipProgramId: z
		.uuid()
		.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	schoolYear: z.string().max(20).openapi({ example: '2023 - 2024' }),
	totalBudget: z.string().openapi({ example: 1000000.0 }),
	isActive: z.boolean().default(true).openapi({ example: true }),
	isArchived: z.boolean().default(false).openapi({ example: false }),
});

export const UpdateProgramOfferingSchema =
	CreateProgramOfferingSchema.partial().refine(
		(v) => Object.keys(v).length > 0,
		{
			message: 'At least one program offering field is required',
		},
	);

export const ProgramOfferingResponseSchema = z.object({
	id: z.uuid(),
	scholarshipProgramId: z.uuid().nullable(),
	schoolYear: z.string(),
	isArchived: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const ProgramOfferingsOffsetResponseSchema = z.object({
	data: ProgramOfferingResponseSchema.array(),
	meta: OffsetMetaSchema,
});

export const ProgramOfferingsCursorResponseSchema = z.object({
	data: ProgramOfferingResponseSchema.array(),
	meta: CursorMetaSchema,
});

export const ProgramOfferingsOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'TES' }),
	sort: z
		.enum(['schoolYear', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const ProgramOfferingsCursorQuerySchema = CursorQuerySchema;

export type UpdateProgramOfferingInput = z.infer<
	typeof UpdateProgramOfferingSchema
>;
export type CreateProgramOfferingInput = z.infer<
	typeof CreateProgramOfferingSchema
>;

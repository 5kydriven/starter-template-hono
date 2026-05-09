import {
	CursorMetaSchema,
	CursorQuerySchema,
	OffsetMetaSchema,
	OffsetQuerySchema,
} from '@/lib/pagination';
import z from 'zod';

export const CourseParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateCourseSchema = z.object({
	name: z
		.string()
		.min(2)
		.max(100)
		.openapi({ example: 'Bachelor of Science in Information Technology' }),
	abbreviation: z.string().min(3).max(20).openapi({ example: 'BSIT' }),
	major: z.string().optional().openapi({ example: 'Programming' }),
});

export const UpdateCourseSchema = CreateCourseSchema.partial().refine(
	(v) => Object.keys(v).length > 0,
	{
		message: 'At least one course field is required',
	},
);

export const CourseResponseSchema = z.object({
	id: z.uuid(),
	name: z.string(),
	abbreviation: z.string(),
	major: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const CoursesOffsetResponseSchema = z.object({
	data: CourseResponseSchema.array(),
	meta: OffsetMetaSchema,
});

export const CoursesCursorResponseSchema = z.object({
	data: CourseResponseSchema.array(),
	meta: CursorMetaSchema,
});

export const CoursesOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'BSIT' }),
	sort: z
		.enum(['name', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const CoursesCursorQuerySchema = CursorQuerySchema;

export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

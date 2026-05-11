import {
	OffsetMetaSchema,
	CursorMetaSchema,
	OffsetQuerySchema,
	CursorQuerySchema,
} from '@/lib/pagination';
import z from 'zod';

export const AddressesParamsSchema = z.object({
	id: z.uuid().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
});

export const CreateAddressSchema = z.object({
	applicationId: z
		.uuid()
		.openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
	type: z.enum(['permanent', 'current']).openapi({ example: 'current' }),
	province: z
		.string()
		.min(2)
		.max(100)
		.openapi({ example: 'Negros Occidental' }),
	cityMunicipality: z
		.string()
		.min(2)
		.max(100)
		.openapi({ example: 'San Carlos City' }),
	barangay: z.string().min(2).max(100).openapi({ example: 'Barangay V' }),
	street: z.string().min(2).max(100).openapi({ example: 'Ylagan Extension' }),
	zipCode: z.string().min(2).max(6).openapi({ example: '6127' }),
});

export const UpdateAddressSchema = CreateAddressSchema.partial().refine(
	(v) => Object.keys(v).length > 0,
	{
		message: 'At least one address field is required',
	},
);

export const AddressResponseSchema = z.object({
	id: z.uuid(),
	applicationId: z.uuid(),
	type: z.enum(['permanent', 'current']),
	province: z.string(),
	cityMunicipality: z.string(),
	barangay: z.string(),
	street: z.string().nullable(),
	zipCode: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

export const AddressesOffsetResponseSchema = z.object({
	data: AddressResponseSchema.array(),
	meta: OffsetMetaSchema,
});

export const AddressesCursorResponseSchema = z.object({
	data: AddressResponseSchema.array(),
	meta: CursorMetaSchema,
});

export const AddressesOffsetQuerySchema = OffsetQuerySchema.extend({
	search: z.string().optional().openapi({ example: 'Jl. Raya' }),
	sort: z
		.enum(['province', 'cityMunicipality', 'barangay', 'street', 'createdAt'])
		.default('createdAt')
		.openapi({ example: 'createdAt' }),
	order: z.enum(['asc', 'desc']).default('desc').openapi({ example: 'desc' }),
});

export const AddressesCursorQuerySchema = CursorQuerySchema;

export type UpdateAddressInput = z.infer<typeof UpdateAddressSchema>;
export type CreateAddressInput = z.infer<typeof CreateAddressSchema>;

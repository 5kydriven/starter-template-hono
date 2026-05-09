import z from 'zod';
import { Errors } from './errors';

export const OffsetMetaSchema = z.object({
	total: z.number().int().min(0),
	page: z.number().int().min(1),
	perPage: z.number().int().min(1),
	totalPages: z.number().int().min(0),
	hasNext: z.boolean(),
	hasPrev: z.boolean(),
});

export const CursorMetaSchema = z.object({
	nextCursor: z.string().nullable(),
	prevCursor: z.string().nullable(),
	hasNext: z.boolean(),
	hasPrev: z.boolean(),
	perPage: z.number().int().min(1),
});

export const OffsetQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1).openapi({ example: 1 }),
	perPage: z.coerce
		.number()
		.int()
		.min(1)
		.max(100)
		.default(20)
		.openapi({ example: 20 }),
});

export const CursorQuerySchema = z.object({
	cursor: z.string().optional().openapi({ example: 'eyJpZCI6ImExYjIifQ==' }),
	perPage: z.coerce.number().int().min(1).max(100).default(20),
	direction: z.enum(['next', 'prev']).default('next'),
});

export const encodeCursor = (id: string) =>
	Buffer.from(JSON.stringify({ id })).toString('base64url');

export const decodeCursor = (cursor: string | null) => {
	if (!cursor) return null;

	try {
		const decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as {
			id?: unknown;
		};

		if (typeof decoded.id !== 'string' || decoded.id.length === 0) {
			throw new Error('Cursor id is missing');
		}

		return { id: decoded.id };
	} catch {
		throw Errors.validation([
			{ field: 'cursor', message: 'Invalid pagination cursor' },
		]);
	}
};

export const createOffsetMeta = (opts: {
	total: number;
	page: number;
	perPage: number;
}) => {
	const { total, page, perPage } = opts;
	const totalPages = Math.ceil(total / perPage);

	return {
		total,
		page,
		perPage,
		totalPages,
		hasNext: page < totalPages,
		hasPrev: page > 1,
	};
};

export const createCursorMeta = (opts: {
	nextCursor: string | null;
	prevCursor: string | null;
	hasNext: boolean;
	hasPrev: boolean;
	perPage: number;
}) => opts;

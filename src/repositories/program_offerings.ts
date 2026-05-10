import { Db } from '@/db';
import { NewProgramOffering, programOfferings } from '@/db/schema';
import { decodeCursor, encodeCursor } from '@/lib/pagination';
import { and, asc, count, desc, eq, gt, ilike, lt, or } from 'drizzle-orm';

export const createProgramOfferingsRepo = (db: Db) => ({
	findById: (id: string) =>
		db
			.select()
			.from(programOfferings)
			.where(eq(programOfferings.id, id))
			.limit(1)
			.then((r) => r[0] ?? null),

	create: (data: NewProgramOffering) =>
		db
			.insert(programOfferings)
			.values(data)
			.returning()
			.then((r) => r[0]),

	update: (id: string, data: Partial<NewProgramOffering>) =>
		db
			.update(programOfferings)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(programOfferings.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	softDelete: (id: string) =>
		db
			.update(programOfferings)
			.set({ isArchived: true, updatedAt: new Date().toISOString() })
			.where(eq(programOfferings.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	findManyOffset: async (opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'schoolYear' | 'createdAt';
		sortOrder?: 'asc' | 'desc';
	}) => {
		const {
			page,
			perPage,
			search,
			sortField = 'createdAt',
			sortOrder = 'desc',
		} = opts;
		const offset = (page - 1) * perPage;

		const conditions = [];
		if (search) {
			conditions.push(or(ilike(programOfferings.schoolYear, `%${search}%`)));
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const orderBy =
			sortOrder === 'asc'
				? asc(programOfferings[sortField])
				: desc(programOfferings[sortField]);

		const [rows, [{ value: total }]] = await Promise.all([
			db
				.select()
				.from(programOfferings)
				.where(where)
				.orderBy(orderBy)
				.limit(perPage)
				.offset(offset),
			db.select({ value: count() }).from(programOfferings).where(where),
		]);

		return { rows, total: Number(total) };
	},

	findManyCursor: async (opts: {
		cursor: string | null;
		perPage: number;
		direction: 'next' | 'prev';
	}) => {
		const { cursor, perPage, direction } = opts;
		const decodedCursor = decodeCursor(cursor);

		const where = decodedCursor?.id
			? direction === 'next'
				? gt(programOfferings.id, decodedCursor.id)
				: lt(programOfferings.id, decodedCursor.id)
			: undefined;

		const rows = await db
			.select()
			.from(programOfferings)
			.where(where)
			.orderBy(
				direction === 'next'
					? asc(programOfferings.id)
					: desc(programOfferings.id),
			)
			.limit(perPage + 1);
		const hasMore = rows.length > perPage;
		if (hasMore) rows.pop();

		if (direction === 'prev') rows.reverse();

		const nextCursor =
			rows.length > 0 && (direction === 'next' ? hasMore : cursor)
				? encodeCursor(rows.at(-1)!.id)
				: null;
		const prevCursor =
			rows.length > 0 && (direction === 'next' ? cursor : hasMore)
				? encodeCursor(rows[0].id)
				: null;

		return {
			rows,
			nextCursor,
			prevCursor,
			hasNext: nextCursor !== null,
			hasPrev: prevCursor !== null,
		};
	},
});

export type ProgramOfferingsRepo = ReturnType<
	typeof createProgramOfferingsRepo
>;

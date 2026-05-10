import { Db } from '@/db';
import { NewParent, parents } from '@/db/schema';
import { decodeCursor, encodeCursor } from '@/lib/pagination';
import { and, asc, count, desc, eq, gt, ilike, lt, or } from 'drizzle-orm';

export const createParentsRepo = (db: Db) => ({
	findById: (id: string) =>
		db
			.select()
			.from(parents)
			.where(eq(parents.id, id))
			.limit(1)
			.then((r) => r[0] ?? null),

	create: (data: NewParent) =>
		db
			.insert(parents)
			.values(data)
			.returning()
			.then((r) => r[0]),

	update: (id: string, data: Partial<NewParent>) =>
		db
			.update(parents)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(parents.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	delete: (id: string) =>
		db
			.delete(parents)
			.where(eq(parents.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	findManyOffset: async (opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'firstName' | 'lastName' | 'middleName' | 'createdAt';
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
			conditions.push(
				or(
					ilike(parents.firstName, `%${search}%`),
					ilike(parents.lastName, `%${search}%`),
					ilike(parents.middleName, `%${search}%`),
				),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const orderBy =
			sortOrder === 'asc' ? asc(parents[sortField]) : desc(parents[sortField]);

		const [rows, [{ value: total }]] = await Promise.all([
			db
				.select()
				.from(parents)
				.where(where)
				.orderBy(orderBy)
				.limit(perPage)
				.offset(offset),
			db.select({ value: count() }).from(parents).where(where),
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
				? gt(parents.id, decodedCursor.id)
				: lt(parents.id, decodedCursor.id)
			: undefined;

		const rows = await db
			.select()
			.from(parents)
			.where(where)
			.orderBy(direction === 'next' ? asc(parents.id) : desc(parents.id))
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

export type ParentsRepo = ReturnType<typeof createParentsRepo>;

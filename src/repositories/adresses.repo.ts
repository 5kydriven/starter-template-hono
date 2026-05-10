import { Db } from '@/db';
import { addresses, courses, NewAddress } from '@/db/schema';
import { decodeCursor, encodeCursor } from '@/lib/pagination';
import { SortOrder } from '@/types/common';
import { and, asc, count, desc, eq, gt, ilike, lt, or } from 'drizzle-orm';

export const createAddressesRepo = (db: Db) => ({
	findById: (id: string) =>
		db
			.select()
			.from(addresses)
			.where(eq(addresses.id, id))
			.limit(1)
			.then((r) => r[0] ?? null),

	create: (data: NewAddress) =>
		db
			.insert(addresses)
			.values(data)
			.returning()
			.then((r) => r[0]),

	update: (id: string, data: Partial<NewAddress>) =>
		db
			.update(addresses)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(addresses.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	delete: (id: string) =>
		db
			.delete(addresses)
			.where(eq(addresses.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	findManyOffset: async (opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?:
			| 'province'
			| 'cityMunicipality'
			| 'barangay'
			| 'street'
			| 'createdAt';
		sortOrder?: SortOrder;
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
					ilike(addresses.province, `%${search}%`),
					ilike(addresses.cityMunicipality, `%${search}%`),
					ilike(addresses.barangay, `%${search}%`),
					ilike(addresses.street, `%${search}%`),
				),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const orderBy =
			sortOrder === 'asc'
				? asc(addresses[sortField])
				: desc(addresses[sortField]);

		const [rows, [{ value: total }]] = await Promise.all([
			db
				.select()
				.from(addresses)
				.where(where)
				.orderBy(orderBy)
				.limit(perPage)
				.offset(offset),
			db.select({ value: count() }).from(addresses).where(where),
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
				? gt(addresses.id, decodedCursor.id)
				: lt(addresses.id, decodedCursor.id)
			: undefined;

		const rows = await db
			.select()
			.from(addresses)
			.where(where)
			.orderBy(direction === 'next' ? asc(addresses.id) : desc(addresses.id))
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

export type AddressesRepo = ReturnType<typeof createAddressesRepo>;

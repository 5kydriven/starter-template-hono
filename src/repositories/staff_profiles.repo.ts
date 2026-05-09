import { and, asc, count, desc, eq, gt, ilike, lt, or } from 'drizzle-orm';
import type { Db } from '@/db';
import { staffProfile, user } from '@/db/schema';
import type { NewStaffProfile } from '@/db/schema';
import { decodeCursor, encodeCursor } from '@/lib/pagination';
import type { SortOrder } from '@/types/common';

export const createStaffProfilesRepo = (db: Db) => ({
	findById: (id: string) =>
		db
			.select()
			.from(staffProfile)
			.where(eq(staffProfile.id, id))
			.limit(1)
			.then((r) => r[0] ?? null),

	findByUserId: (userId: string) =>
		db
			.select()
			.from(staffProfile)
			.where(eq(staffProfile.userId, userId))
			.limit(1)
			.then((r) => r[0] ?? null),

	updateUserRole: (userId: string, role: 'personnel') =>
		db
			.update(user)
			.set({ role, updatedAt: new Date().toISOString() })
			.where(eq(user.id, userId))
			.returning()
			.then((r) => r[0] ?? null),

	create: (data: NewStaffProfile) =>
		db
			.insert(staffProfile)
			.values(data)
			.returning()
			.then((r) => r[0]),

	update: (id: string, data: Partial<NewStaffProfile>) =>
		db
			.update(staffProfile)
			.set({ ...data, updatedAt: new Date().toISOString() })
			.where(eq(staffProfile.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	delete: (id: string) =>
		db
			.delete(staffProfile)
			.where(eq(staffProfile.id, id))
			.returning()
			.then((r) => r[0] ?? null),

	deleteUser: (userId: string) =>
		db.delete(user).where(eq(user.id, userId)).returning(),

	// Offset pagination with search + sort
	findManyOffset: async (opts: {
		page: number;
		perPage: number;
		search?: string;
		sortField?: 'lastName' | 'firstName' | 'createdAt';
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
					ilike(staffProfile.firstName, `%${search}%`),
					ilike(staffProfile.lastName, `%${search}%`),
				),
			);
		}

		const where = conditions.length > 0 ? and(...conditions) : undefined;
		const orderBy =
			sortOrder === 'asc'
				? asc(staffProfile[sortField])
				: desc(staffProfile[sortField]);

		const [rows, [{ value: total }]] = await Promise.all([
			db
				.select()
				.from(staffProfile)
				.where(where)
				.orderBy(orderBy)
				.limit(perPage)
				.offset(offset),
			db.select({ value: count() }).from(staffProfile).where(where),
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
				? gt(staffProfile.id, decodedCursor.id)
				: lt(staffProfile.id, decodedCursor.id)
			: undefined;

		const rows = await db
			.select()
			.from(staffProfile)
			.where(where)
			.orderBy(
				direction === 'next' ? asc(staffProfile.id) : desc(staffProfile.id),
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

export type StaffProfilesRepo = ReturnType<typeof createStaffProfilesRepo>;

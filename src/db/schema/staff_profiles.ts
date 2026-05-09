import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { user, userRoleEnum } from './auth';

export const staffProfile = pgTable('staff_profiles', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: text('user_id')
		.notNull()
		.unique()
		.references(() => user.id, { onDelete: 'cascade' }),
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	department: text('department').notNull(),
	position: text('position').notNull(),
	role: userRoleEnum('role').notNull(),
	contactNumber: text('contact_number'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
});

export type StaffProfile = typeof staffProfile.$inferSelect;
export type NewStaffProfile = typeof staffProfile.$inferInsert;

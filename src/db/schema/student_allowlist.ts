import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { staffProfile } from './staff_profiles';

export const studentAllowlist = pgTable('student_allowlist', {
	id: uuid('id').defaultRandom().primaryKey(),
	studentNumber: text('student_number').notNull().unique(),
	isRegistered: boolean('is_registered').default(false),
	uploadedBy: text('uploaded_by').references(() => staffProfile.userId),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.defaultNow()
		.notNull(),
});

export type StudentAllowlist = typeof studentAllowlist.$inferSelect;
export type NewStudentAllowlist = typeof studentAllowlist.$inferInsert;

import {
	boolean,
	index,
	numeric,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { scholarshipPrograms } from '.';

export const programOfferings = pgTable(
	'program_offerings',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		programId: uuid('program_id').references(() => scholarshipPrograms.id, {
			onDelete: 'set null',
		}),
		schoolYear: text('school_year').notNull(),
		totalBudget: numeric('total_budget', { precision: 10, scale: 2 }).notNull(),
		isActive: boolean('is_active').default(true),
		isArchived: boolean('is_archived').default(false),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [index('idx_program_offerings_program_id').on(table.programId)],
);

export type ProgramOffering = typeof programOfferings.$inferSelect;
export type NewProgramOffering = typeof programOfferings.$inferInsert;

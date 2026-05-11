import {
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from 'drizzle-orm/pg-core';
import { applications } from './applications';

export const addressTypeEnum = pgEnum('address_type', ['permanent', 'current']);

export const addresses = pgTable(
	'addresses',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		applicationId: uuid('application_id')
			.notNull()
			.references(() => applications.id, {
				onDelete: 'cascade',
			}),
		type: addressTypeEnum('type').notNull(),
		province: text('province').notNull(),
		cityMunicipality: text('city_municipality').notNull(),
		barangay: text('barangay').notNull(),
		street: text('street'),
		zipCode: text('zip_code').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
	},
	(table) => [index('idx_addresses_application_id').on(table.applicationId)],
);

export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

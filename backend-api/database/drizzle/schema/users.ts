import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';

/**
 * Users Table Schema (Drizzle)
 * 
 * Matches the Prisma User model for consistency
 */
export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  age: integer('age').notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
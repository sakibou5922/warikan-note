import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const groups = sqliteTable("groups", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull().references(() => groups.id),
  name: text("name").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull().references(() => groups.id),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  payerId: text("payer_id").notNull().references(() => members.id),
  createdAt: integer("created_at").notNull(),
});

export const expenseParticipants = sqliteTable("expense_participants", {
  expenseId: text("expense_id").notNull().references(() => expenses.id),
  memberId: text("member_id").notNull().references(() => members.id),
}, (table) => [primaryKey({ columns: [table.expenseId, table.memberId] })]);

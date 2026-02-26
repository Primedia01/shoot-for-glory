import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  province: text("province"),
});

export const shots = pgTable("shots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").notNull(),
  power: integer("power").notNull(),
  angle: integer("angle").notNull(),
  isGoal: integer("is_goal").notNull(),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(players).omit({ id: true });
export const insertShotSchema = createInsertSchema(shots).omit({ id: true, createdAt: true });

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertShot = z.infer<typeof insertShotSchema>;
export type Shot = typeof shots.$inferSelect;

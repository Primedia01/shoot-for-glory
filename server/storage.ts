import { type Player, type InsertPlayer, type Shot, type InsertShot, players, shots } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(id: string): Promise<Player | undefined>;
  recordShot(shot: InsertShot): Promise<Shot>;
  getLeaderboard(): Promise<{ playerId: string; username: string; totalPoints: number }[]>;
  getPlayerScore(playerId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async createPlayer(player: InsertPlayer): Promise<Player> {
    const [result] = await db.insert(players).values(player).returning();
    return result;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    const [result] = await db.select().from(players).where(eq(players.id, id));
    return result;
  }

  async recordShot(shot: InsertShot): Promise<Shot> {
    const [result] = await db.insert(shots).values(shot).returning();
    return result;
  }

  async getLeaderboard(): Promise<{ playerId: string; username: string; totalPoints: number }[]> {
    const results = await db
      .select({
        playerId: players.id,
        username: players.username,
        totalPoints: sql<number>`COALESCE(SUM(${shots.points}), 0)::int`,
      })
      .from(players)
      .leftJoin(shots, eq(players.id, shots.playerId))
      .groupBy(players.id, players.username)
      .orderBy(desc(sql`COALESCE(SUM(${shots.points}), 0)`))
      .limit(10);
    return results;
  }

  async getPlayerScore(playerId: string): Promise<number> {
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(${shots.points}), 0)::int` })
      .from(shots)
      .where(eq(shots.playerId, playerId));
    return result?.total ?? 0;
  }
}

export const storage = new DatabaseStorage();

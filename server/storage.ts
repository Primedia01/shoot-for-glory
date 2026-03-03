import { type InsertGameScore, type GameScore, gameScores } from "@shared/schema";
import { db } from "./db";
import { desc, sql } from "drizzle-orm";

export interface IStorage {
  saveGameScore(score: InsertGameScore): Promise<GameScore>;
  getGlobalLeaderboard(limit?: number): Promise<{ id: string; playerName: string; province: string | null; totalPoints: number; shotsScored: number; createdAt: Date | null }[]>;
}

export class DatabaseStorage implements IStorage {
  async saveGameScore(score: InsertGameScore): Promise<GameScore> {
    const [result] = await db.insert(gameScores).values(score).returning();
    return result;
  }

  async getGlobalLeaderboard(limit = 10) {
    return await db
      .select({
        id: gameScores.id,
        playerName: gameScores.playerName,
        province: gameScores.province,
        totalPoints: gameScores.totalPoints,
        shotsScored: gameScores.shotsScored,
        createdAt: gameScores.createdAt,
      })
      .from(gameScores)
      .orderBy(desc(gameScores.totalPoints), desc(gameScores.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();

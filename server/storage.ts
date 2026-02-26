import { type Player, type InsertPlayer, type Shot, type InsertShot } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  createPlayer(player: InsertPlayer): Promise<Player>;
  getPlayer(id: string): Promise<Player | undefined>;
  recordShot(shot: InsertShot): Promise<Shot>;
  getLeaderboard(): Promise<{ playerId: string; username: string; totalPoints: number }[]>;
  getPlayerScore(playerId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player> = new Map();
  private shotsList: Shot[] = [];

  async createPlayer(player: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const p: Player = { id, username: player.username, province: player.province ?? null };
    this.players.set(id, p);
    return p;
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async recordShot(shot: InsertShot): Promise<Shot> {
    const id = randomUUID();
    const s: Shot = { id, playerId: shot.playerId, power: shot.power, angle: shot.angle, isGoal: shot.isGoal, points: shot.points, createdAt: new Date() };
    this.shotsList.push(s);
    return s;
  }

  async getLeaderboard(): Promise<{ playerId: string; username: string; totalPoints: number }[]> {
    const scores = new Map<string, number>();
    for (const s of this.shotsList) {
      scores.set(s.playerId, (scores.get(s.playerId) || 0) + s.points);
    }
    return Array.from(scores.entries())
      .map(([playerId, totalPoints]) => ({
        playerId,
        username: this.players.get(playerId)?.username || "Unknown",
        totalPoints,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 10);
  }

  async getPlayerScore(playerId: string): Promise<number> {
    return this.shotsList
      .filter((s) => s.playerId === playerId)
      .reduce((sum, s) => sum + s.points, 0);
  }
}

export const storage = new MemStorage();

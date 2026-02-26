import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPlayerSchema, insertShotSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/players", async (req, res) => {
    const parsed = insertPlayerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const player = await storage.createPlayer(parsed.data);
    res.json(player);
  });

  app.get("/api/players/:id", async (req, res) => {
    const player = await storage.getPlayer(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.json(player);
  });

  app.post("/api/shots", async (req, res) => {
    const parsed = insertShotSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.message });
    }
    const shot = await storage.recordShot(parsed.data);
    res.json(shot);
  });

  app.get("/api/leaderboard", async (_req, res) => {
    const leaderboard = await storage.getLeaderboard();
    res.json(leaderboard);
  });

  app.get("/api/players/:id/score", async (req, res) => {
    const score = await storage.getPlayerScore(req.params.id);
    res.json({ score });
  });

  return httpServer;
}

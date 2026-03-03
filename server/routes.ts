import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket } from "./websocket";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupWebSocket(httpServer);

  app.get("/api/leaderboard", async (_req, res) => {
    const leaderboard = await storage.getGlobalLeaderboard(20);
    res.json(leaderboard);
  });

  return httpServer;
}

import { WebSocketServer, WebSocket } from "ws";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { storage } from "./storage";

const MAX_SHOTS = 3;

interface PlayerData {
  ws: WebSocket;
  playerName: string;
  mobile: string;
  province: string;
  consent: boolean;
  shotsUsed: number;
  totalPoints: number;
  goalsScored: number;
}

interface Room {
  code: string;
  billboard: WebSocket | null;
  mobiles: Map<string, PlayerData>;
}

const rooms = new Map<string, Room>();
const allBillboards = new Set<WebSocket>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function sendTo(ws: WebSocket, message: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function getRoomLeaderboard(room: Room) {
  return Array.from(room.mobiles.entries())
    .map(([playerId, data]) => ({
      playerId,
      playerName: data.playerName,
      totalPoints: data.totalPoints,
      province: data.province,
    }))
    .filter((e) => e.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10);
}

async function getGlobalLeaderboard() {
  const entries = await storage.getGlobalLeaderboard(20);
  return entries.map((e) => ({
    id: e.id,
    playerName: e.playerName,
    province: e.province,
    totalPoints: e.totalPoints,
    shotsScored: e.shotsScored,
    createdAt: e.createdAt,
  }));
}

function broadcastGlobalLeaderboard(globalLeaderboard: any[]) {
  const msg = { type: "global_leaderboard_update", leaderboard: globalLeaderboard };
  for (const billboard of allBillboards) {
    sendTo(billboard, msg);
  }
  for (const room of rooms.values()) {
    for (const [, mobile] of room.mobiles) {
      sendTo(mobile.ws, msg);
    }
  }
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    let currentRoom: Room | null = null;
    let currentPlayerId: string | null = null;
    let isBillboard = false;

    ws.on("message", (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      switch (msg.type) {
        case "create_room": {
          let code = generateRoomCode();
          while (rooms.has(code)) code = generateRoomCode();
          const room: Room = {
            code,
            billboard: ws,
            mobiles: new Map(),
          };
          rooms.set(code, room);
          currentRoom = room;
          isBillboard = true;
          allBillboards.add(ws);

          getGlobalLeaderboard().then((globalLeaderboard) => {
            sendTo(ws, { type: "room_created", roomCode: code, globalLeaderboard });
          });
          break;
        }

        case "join_room": {
          const room = rooms.get(msg.roomCode?.toUpperCase());
          if (!room) {
            sendTo(ws, { type: "error", message: "Room not found. Check the code and try again." });
            return;
          }
          const playerId = nanoid(10);
          currentRoom = room;
          currentPlayerId = playerId;

          const playerData: PlayerData = {
            ws,
            playerName: msg.playerName || "Player",
            mobile: msg.mobile || "",
            province: msg.province || "",
            consent: msg.consent || false,
            shotsUsed: 0,
            totalPoints: 0,
            goalsScored: 0,
          };
          room.mobiles.set(playerId, playerData);

          getGlobalLeaderboard().then((globalLeaderboard) => {
            sendTo(ws, {
              type: "joined",
              playerId,
              roomCode: room.code,
              maxShots: MAX_SHOTS,
              shotsRemaining: MAX_SHOTS,
              leaderboard: getRoomLeaderboard(room),
              globalLeaderboard,
            });
          });

          if (room.billboard) {
            sendTo(room.billboard, {
              type: "player_joined",
              playerId,
              playerName: playerData.playerName,
              province: playerData.province,
              playerCount: room.mobiles.size,
            });
          }
          break;
        }

        case "shoot": {
          if (!currentRoom || !currentPlayerId) return;
          const room = currentRoom;
          const player = room.mobiles.get(currentPlayerId);
          if (!player) return;

          if (player.shotsUsed >= MAX_SHOTS) {
            sendTo(ws, { type: "error", message: "You've used all your shots!" });
            return;
          }

          player.shotsUsed++;
          const points = msg.isGoal ? 100 : 0;
          player.totalPoints += points;
          if (msg.isGoal) player.goalsScored++;

          const shotsRemaining = MAX_SHOTS - player.shotsUsed;
          const roomLeaderboard = getRoomLeaderboard(room);
          const isGameOver = shotsRemaining === 0;

          if (room.billboard) {
            sendTo(room.billboard, {
              type: "shot_fired",
              playerId: currentPlayerId,
              playerName: player.playerName,
              power: msg.power,
              angle: msg.angle,
              isGoal: msg.isGoal,
              points,
              shotNumber: player.shotsUsed,
              maxShots: MAX_SHOTS,
              totalScore: player.totalPoints,
              leaderboard: roomLeaderboard,
            });
          }

          sendTo(ws, {
            type: "shot_result",
            isGoal: msg.isGoal,
            points,
            totalScore: player.totalPoints,
            shotsRemaining,
            shotNumber: player.shotsUsed,
            maxShots: MAX_SHOTS,
            leaderboard: roomLeaderboard,
          });

          if (isGameOver) {
            const pid = currentPlayerId;
            setTimeout(async () => {
              try {
                await storage.saveGameScore({
                  playerName: player.playerName,
                  mobile: player.mobile || null,
                  province: player.province || null,
                  totalPoints: player.totalPoints,
                  shotsScored: player.goalsScored,
                  totalShots: MAX_SHOTS,
                });

                const globalLeaderboard = await getGlobalLeaderboard();

                sendTo(ws, {
                  type: "game_over",
                  totalScore: player.totalPoints,
                  leaderboard: getRoomLeaderboard(room),
                  globalLeaderboard,
                });

                if (room.billboard) {
                  sendTo(room.billboard, {
                    type: "player_finished",
                    playerId: pid,
                    playerName: player.playerName,
                    totalScore: player.totalPoints,
                    leaderboard: getRoomLeaderboard(room),
                    globalLeaderboard,
                  });
                }

                broadcastGlobalLeaderboard(globalLeaderboard);
              } catch (err) {
                console.error("Error saving game score:", err);
                sendTo(ws, {
                  type: "game_over",
                  totalScore: player.totalPoints,
                  leaderboard: getRoomLeaderboard(room),
                });
                if (room.billboard) {
                  sendTo(room.billboard, {
                    type: "player_finished",
                    playerId: pid,
                    playerName: player.playerName,
                    totalScore: player.totalPoints,
                    leaderboard: getRoomLeaderboard(room),
                  });
                }
              }
            }, 4500);
          }

          for (const [pid, mobile] of room.mobiles) {
            if (pid !== currentPlayerId) {
              sendTo(mobile.ws, { type: "leaderboard_update", leaderboard: roomLeaderboard });
            }
          }
          break;
        }
      }
    });

    ws.on("close", () => {
      if (!currentRoom) return;

      if (isBillboard) {
        allBillboards.delete(ws);
        for (const [, mobile] of currentRoom.mobiles) {
          sendTo(mobile.ws, { type: "room_closed" });
        }
        rooms.delete(currentRoom.code);
      } else if (currentPlayerId) {
        currentRoom.mobiles.delete(currentPlayerId);
        if (currentRoom.billboard) {
          sendTo(currentRoom.billboard, {
            type: "player_left",
            playerId: currentPlayerId,
            playerCount: currentRoom.mobiles.size,
          });
        }
      }
    });
  });

  return wss;
}

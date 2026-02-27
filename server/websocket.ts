import { WebSocketServer, WebSocket } from "ws";
import { type Server } from "http";
import { nanoid } from "nanoid";

interface Room {
  code: string;
  billboard: WebSocket | null;
  mobiles: Map<string, { ws: WebSocket; playerName: string }>;
  leaderboard: Map<string, { playerName: string; totalPoints: number }>;
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcast(room: Room, message: object, exclude?: WebSocket) {
  const data = JSON.stringify(message);
  if (room.billboard && room.billboard !== exclude && room.billboard.readyState === WebSocket.OPEN) {
    room.billboard.send(data);
  }
  for (const [, mobile] of room.mobiles) {
    if (mobile.ws !== exclude && mobile.ws.readyState === WebSocket.OPEN) {
      mobile.ws.send(data);
    }
  }
}

function sendTo(ws: WebSocket, message: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function getLeaderboardArray(room: Room) {
  return Array.from(room.leaderboard.entries())
    .map(([playerId, data]) => ({ playerId, ...data }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 10);
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
            leaderboard: new Map(),
          };
          rooms.set(code, room);
          currentRoom = room;
          isBillboard = true;
          sendTo(ws, { type: "room_created", roomCode: code });
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
          room.mobiles.set(playerId, { ws, playerName: msg.playerName });
          room.leaderboard.set(playerId, { playerName: msg.playerName, totalPoints: 0 });

          sendTo(ws, {
            type: "joined",
            playerId,
            roomCode: room.code,
            leaderboard: getLeaderboardArray(room),
          });

          if (room.billboard) {
            sendTo(room.billboard, {
              type: "player_joined",
              playerId,
              playerName: msg.playerName,
              playerCount: room.mobiles.size,
            });
          }
          break;
        }

        case "shoot": {
          if (!currentRoom || !currentPlayerId) return;
          const room = currentRoom;
          const entry = room.leaderboard.get(currentPlayerId);
          if (!entry) return;

          const points = msg.isGoal ? 100 : 0;
          entry.totalPoints += points;

          const leaderboard = getLeaderboardArray(room);

          if (room.billboard) {
            sendTo(room.billboard, {
              type: "shot_fired",
              playerId: currentPlayerId,
              playerName: entry.playerName,
              power: msg.power,
              angle: msg.angle,
              isGoal: msg.isGoal,
              points,
              leaderboard,
            });
          }

          sendTo(ws, {
            type: "shot_result",
            isGoal: msg.isGoal,
            points,
            totalScore: entry.totalPoints,
            leaderboard,
          });

          for (const [pid, mobile] of room.mobiles) {
            if (pid !== currentPlayerId) {
              sendTo(mobile.ws, { type: "leaderboard_update", leaderboard });
            }
          }
          break;
        }
      }
    });

    ws.on("close", () => {
      if (!currentRoom) return;

      if (isBillboard) {
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

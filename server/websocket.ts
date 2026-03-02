import { WebSocketServer, WebSocket } from "ws";
import { type Server } from "http";
import { nanoid } from "nanoid";

const MAX_SHOTS = 3;

interface PlayerData {
  ws: WebSocket;
  playerName: string;
  mobile: string;
  province: string;
  consent: boolean;
  shotsUsed: number;
  totalPoints: number;
}

interface Room {
  code: string;
  billboard: WebSocket | null;
  mobiles: Map<string, PlayerData>;
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

function sendTo(ws: WebSocket, message: object) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function getLeaderboardArray(room: Room) {
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

          const playerData: PlayerData = {
            ws,
            playerName: msg.playerName || "Player",
            mobile: msg.mobile || "",
            province: msg.province || "",
            consent: msg.consent || false,
            shotsUsed: 0,
            totalPoints: 0,
          };
          room.mobiles.set(playerId, playerData);

          sendTo(ws, {
            type: "joined",
            playerId,
            roomCode: room.code,
            maxShots: MAX_SHOTS,
            shotsRemaining: MAX_SHOTS,
            leaderboard: getLeaderboardArray(room),
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

          const shotsRemaining = MAX_SHOTS - player.shotsUsed;
          const leaderboard = getLeaderboardArray(room);
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
              leaderboard,
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
            leaderboard,
          });

          if (isGameOver) {
            setTimeout(() => {
              sendTo(ws, {
                type: "game_over",
                totalScore: player.totalPoints,
                leaderboard: getLeaderboardArray(room),
              });

              if (room.billboard) {
                sendTo(room.billboard, {
                  type: "player_finished",
                  playerId: currentPlayerId,
                  playerName: player.playerName,
                  totalScore: player.totalPoints,
                  leaderboard: getLeaderboardArray(room),
                });
              }
            }, 4500);
          }

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

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { ArrowUp, Zap, Target, User, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoalCelebration from "@/components/GoalCelebration";

const soccerBall = "/soccer-ball.png";

type ShotStatus = "idle" | "shooting" | "goal" | "miss";
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalPoints: number;
}

export default function MobileController() {
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [shotStatus, setShotStatus] = useState<ShotStatus>("idle");
  const [power, setPower] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get("room");

  useEffect(() => {
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase());
    }
  }, [roomFromUrl]);

  const connectToRoom = useCallback((code: string, name: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;
    setConnectionStatus("connecting");
    setErrorMessage("");

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "join_room",
        roomCode: code.toUpperCase(),
        playerName: name,
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "joined":
          setPlayerId(msg.playerId);
          setConnectionStatus("connected");
          setLeaderboard(msg.leaderboard || []);
          break;
        case "error":
          setConnectionStatus("error");
          setErrorMessage(msg.message);
          break;
        case "shot_result":
          setShotStatus(msg.isGoal ? "goal" : "miss");
          setTotalScore(msg.totalScore);
          setLeaderboard(msg.leaderboard || []);
          break;
        case "leaderboard_update":
          setLeaderboard(msg.leaderboard || []);
          break;
        case "room_closed":
          setConnectionStatus("disconnected");
          setErrorMessage("The billboard screen was closed.");
          setPlayerId(null);
          break;
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
    };

    ws.onerror = () => {
      setConnectionStatus("error");
      setErrorMessage("Connection failed. Please try again.");
    };
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    if (shotStatus === "goal" || shotStatus === "miss") {
      const timer = setTimeout(() => setShotStatus("idle"), 3000);
      return () => clearTimeout(timer);
    }
  }, [shotStatus]);

  const handleSwipeEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (shotStatus !== "idle") return;
    if (info.offset.y < -80 || info.velocity.y < -400) {
      const isGoal = Math.abs(info.offset.x) < 120;
      const shotPower = Math.min(Math.abs(Math.round(info.velocity.y / 10)), 100);
      const shotAngle = Math.round(info.offset.x);

      setPower(shotPower);
      setShotStatus("shooting");

      wsRef.current?.send(JSON.stringify({
        type: "shoot",
        power: shotPower,
        angle: shotAngle,
        isGoal,
      }));
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode || manualCode;
    if (playerName.trim() && code.trim()) {
      connectToRoom(code.trim(), playerName.trim());
    }
  };

  const currentRank = leaderboard.findIndex(e => e.playerId === playerId) + 1;

  if (!playerId) {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-neutral-950 text-white">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Zap className="w-6 h-6 fill-primary" />
            <span className="font-display tracking-widest text-2xl">SHOOT FOR GLORY</span>
          </div>
          <p className="text-neutral-400 text-sm mb-8 text-center">
            Enter your name and the room code shown on the big screen
          </p>

          <Card className="bg-neutral-900/80 backdrop-blur border-neutral-800 p-6 w-full max-w-sm">
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  data-testid="input-mobile-username"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your display name"
                  className="pl-11 bg-neutral-900 border-neutral-700 text-white h-12 text-lg"
                  autoComplete="off"
                />
              </div>

              <div className="relative">
                <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  data-testid="input-room-code"
                  value={roomCode || manualCode}
                  onChange={(e) => {
                    if (roomCode) return;
                    setManualCode(e.target.value.toUpperCase());
                  }}
                  placeholder="Room code (e.g. AB3K)"
                  className="pl-11 bg-neutral-900 border-neutral-700 text-white h-12 text-lg tracking-[0.3em] uppercase"
                  maxLength={4}
                  readOnly={!!roomCode}
                  autoComplete="off"
                />
              </div>

              {errorMessage && (
                <p data-testid="text-error" className="text-destructive text-sm text-center">{errorMessage}</p>
              )}

              <Button
                data-testid="button-join"
                type="submit"
                className="w-full h-12 text-lg font-display tracking-widest"
                disabled={connectionStatus === "connecting" || !playerName.trim() || !(roomCode || manualCode).trim()}
              >
                {connectionStatus === "connecting" ? "CONNECTING..." : "JOIN GAME"}
              </Button>
            </form>
          </Card>
        </div>

        <div className="text-center pb-4 text-neutral-600 text-xs">
          FIFA World Cup 2026 — DOOH Experience
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-neutral-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 fill-primary text-primary" />
          <span className="font-display text-sm tracking-widest text-primary">LIVE</span>
        </div>
        <div className="flex items-center gap-2 text-neutral-400 text-sm">
          {connectionStatus === "connected" ? (
            <><Wifi className="w-4 h-4 text-primary" /><span>Room {roomCode || manualCode}</span></>
          ) : (
            <><WifiOff className="w-4 h-4 text-destructive" /><span>Disconnected</span></>
          )}
        </div>
        <div className="text-right">
          <span className="font-display text-xl text-primary">{totalScore}</span>
          <span className="text-neutral-500 text-xs ml-1">PTS</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end pb-16 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Target className="w-64 h-64" />
        </div>

        <div className="absolute top-1/4 w-full text-center px-4">
          {shotStatus === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 text-neutral-400"
            >
              <ArrowUp className="w-10 h-10 animate-bounce text-primary" />
              <span className="font-display text-3xl uppercase tracking-widest text-primary">
                Swipe to Shoot
              </span>
              <span className="text-neutral-500 text-sm">Aim for the center of the goal</span>
            </motion.div>
          )}
          {shotStatus === "shooting" && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
            >
              <h2 className="font-display text-5xl text-yellow-400 animate-pulse">Power: {power}%</h2>
            </motion.div>
          )}
          {shotStatus === "goal" && (
            <>
              <GoalCelebration show={true} compact />
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-2"
              >
                <motion.div
                  className="font-display text-7xl text-primary"
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(0,255,102,0.8)",
                      "0 0 40px rgba(0,255,102,1)",
                      "0 0 20px rgba(0,255,102,0.8)",
                    ],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  GOAL!
                </motion.div>
                <motion.div
                  className="font-display text-2xl text-white"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  +100 POINTS
                </motion.div>
              </motion.div>
            </>
          )}
          {shotStatus === "miss" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="font-display text-6xl text-destructive">SAVED!</div>
              <div className="text-neutral-400 mt-2">Try again!</div>
            </motion.div>
          )}
        </div>

        {shotStatus === "idle" ? (
          <motion.div
            data-testid="mobile-ball-draggable"
            className="w-28 h-28 rounded-full cursor-grab active:cursor-grabbing relative z-10 touch-none"
            drag
            dragConstraints={{ left: -80, right: 80, top: -300, bottom: 0 }}
            dragElastic={0.3}
            onDragEnd={handleSwipeEnd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img
              src={soccerBall}
              alt="Soccer Ball"
              className="w-full h-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
          </motion.div>
        ) : (
          <div className="w-28 h-28 opacity-20 transition-opacity duration-500">
            <img src={soccerBall} alt="" className="w-full h-full object-contain blur-sm" draggable={false} />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary/15 to-transparent pointer-events-none" />
      </div>

      {currentRank > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 border border-neutral-800 flex justify-between items-center">
            <span className="text-neutral-400 text-sm">Your Rank</span>
            <span className="font-display text-2xl text-primary">#{currentRank}</span>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation } from "framer-motion";
import { Trophy, Zap, Users, Clock, Gift } from "lucide-react";
import { Card } from "@/components/ui/card";
import { QRCodeSVG } from "qrcode.react";
import GoalCelebration from "@/components/GoalCelebration";
import Goalie from "@/components/Goalie";

type GoalieState = "idle" | "ready" | "diving-left" | "diving-right" | "celebrate";

const stadiumBg = "/stadium-bg.jpg";
const soccerBall = "/soccer-ball.png";

type ShotStatus = "idle" | "shooting" | "goal" | "miss";

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalPoints: number;
  province: string;
}

export default function BillboardScreen() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [shotStatus, setShotStatus] = useState<ShotStatus>("idle");
  const [currentShooter, setCurrentShooter] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastPoints, setLastPoints] = useState(0);
  const [goalieState, setGoalieState] = useState<GoalieState>("idle");
  const [shotInfo, setShotInfo] = useState({ shotNumber: 0, maxShots: 3, totalScore: 0 });
  const billboardBallControls = useAnimation();
  const wsRef = useRef<WebSocket | null>(null);

  const mobileUrl = roomCode
    ? `${window.location.origin}/mobile?room=${roomCode}`
    : "";

  const connectWebSocket = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "create_room" }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "room_created":
          setRoomCode(msg.roomCode);
          break;
        case "player_joined":
          setPlayerCount(msg.playerCount);
          break;
        case "player_left":
          setPlayerCount(msg.playerCount);
          break;
        case "player_finished":
          setLeaderboard(msg.leaderboard || []);
          break;
        case "shot_fired": {
          setCurrentShooter(msg.playerName);
          setShotStatus("shooting");
          setLastPoints(msg.points);
          setShotInfo({ shotNumber: msg.shotNumber, maxShots: msg.maxShots, totalScore: msg.totalScore });
          setLeaderboard(msg.leaderboard || []);

          billboardBallControls.set({ y: 0, x: 0, scale: 1, opacity: 1 });
          const ballGoesRight = msg.angle > 0;
          if (msg.isGoal) {
            setGoalieState(ballGoesRight ? "diving-left" : "diving-right");
            billboardBallControls
              .start({
                y: -220,
                x: msg.angle * 1.2,
                scale: 0.35,
                transition: { duration: 0.45, ease: "easeOut" },
              })
              .then(() => {
                billboardBallControls.start({
                  y: -200,
                  scale: 0.3,
                  transition: { duration: 0.2, type: "spring", bounce: 0.4 },
                });
                setShotStatus("goal");
              });
          } else {
            setGoalieState(ballGoesRight ? "diving-right" : "diving-left");
            billboardBallControls
              .start({
                y: -380,
                x: msg.angle * 3,
                scale: 0.2,
                opacity: 0.6,
                transition: { duration: 0.5, ease: "easeOut" },
              })
              .then(() => {
                setShotStatus("miss");
                setGoalieState("celebrate");
              });
          }
          break;
        }
      }
    };

    ws.onclose = () => {
      setTimeout(connectWebSocket, 3000);
    };
  }, [billboardBallControls]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  useEffect(() => {
    if (shotStatus === "goal" || shotStatus === "miss") {
      const timer = setTimeout(() => {
        setShotStatus("idle");
        setGoalieState("idle");
        billboardBallControls.set({ y: 0, scale: 1, x: 0, opacity: 1 });
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [shotStatus, billboardBallControls]);

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">
      <div className="flex-1 relative bg-neutral-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${stadiumBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />

        <div className="absolute inset-0 flex flex-col z-10">
          <div className="flex justify-between items-start p-8 pb-4">
            <div className="flex-1">
              <div className="flex items-start gap-6">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-4 flex flex-col items-center justify-center min-w-[140px]">
                  <span className="text-neutral-400 text-[10px] tracking-widest uppercase mb-1">Presented by</span>
                  <div className="font-display text-3xl text-white tracking-wider">YOUR LOGO</div>
                </div>

                <div>
                  <h2 className="font-display text-5xl text-white tracking-wider leading-none drop-shadow-lg">
                    SHOOT FOR GLORY
                  </h2>
                  <span className="text-primary font-display text-2xl tracking-wider mt-1 block">
                    LIVE PENALTY ZONE
                  </span>
                  <div className="flex items-center gap-4 mt-2">
                    {playerCount > 0 && (
                      <div className="flex items-center gap-1.5 text-neutral-300">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="font-display text-base tracking-wider">
                          {playerCount} PLAYER{playerCount !== 1 ? "S" : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <Gift className="w-4 h-4 text-yellow-400" />
                      <span className="font-display text-base tracking-wider text-yellow-400">
                        PRIZES TO BE WON
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {roomCode && (
                <Card className="bg-white p-3 border-none flex flex-col items-center">
                  <QRCodeSVG
                    value={mobileUrl}
                    size={130}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                  <div className="mt-1.5 text-center">
                    <p className="text-black font-display text-sm tracking-widest">
                      SCAN TO PLAY
                    </p>
                    <p className="text-neutral-500 font-display text-2xl tracking-[0.4em]">
                      {roomCode}
                    </p>
                  </div>
                </Card>
              )}

              <Card className="bg-black/60 backdrop-blur-md border-neutral-800 p-4 min-w-[250px] max-h-[320px] overflow-hidden">
                <div className="flex items-center gap-2 mb-3 text-primary">
                  <Trophy className="w-5 h-5" />
                  <h3
                    data-testid="text-billboard-leaderboard-title"
                    className="font-display text-xl tracking-widest"
                  >
                    LEADERBOARD
                  </h3>
                </div>
                <div className="space-y-2">
                  {leaderboard.length === 0 && (
                    <p className="text-neutral-500 text-sm text-center py-3">
                      Scan QR to be first!
                    </p>
                  )}
                  {leaderboard.slice(0, 5).map((entry, i) => (
                    <div
                      key={entry.playerId}
                      data-testid={`row-billboard-leaderboard-${i}`}
                      className={`flex justify-between items-center px-3 py-1.5 rounded text-sm ${
                        i === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      <div className="truncate mr-2">
                        <span className="font-bold">{i + 1}. {entry.playerName}</span>
                        {entry.province && (
                          <span className="text-neutral-500 text-xs ml-1">({entry.province})</span>
                        )}
                      </div>
                      <span className="font-display text-xl flex-shrink-0">
                        {entry.totalPoints}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-end pb-12 relative">
            <div className="absolute bottom-6 w-[800px] h-[330px] border-t-8 border-x-8 border-white/80 rounded-t-lg shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <div
                className="w-full h-full opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #fff 1px, transparent 1px), linear-gradient(-45deg, #fff 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-15">
              <Goalie state={goalieState} scale={1.2} />
            </div>

            <motion.div
              className="relative z-20 w-32 h-32"
              initial={{ y: 0, scale: 1, opacity: 1 }}
              animate={billboardBallControls}
            >
              {shotStatus !== "idle" && (
                <img
                  src={soccerBall}
                  alt="Ball"
                  className="w-full h-full object-contain"
                />
              )}
            </motion.div>

            {shotStatus === "idle" && !roomCode && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm border-2 border-primary px-8 py-6 rounded-2xl flex flex-col items-center text-center">
                  <Zap className="w-12 h-12 text-primary fill-primary mb-4" />
                  <h1 className="font-display text-5xl text-white">CONNECTING...</h1>
                </div>
              </div>
            )}

            {shotStatus === "idle" && roomCode && playerCount === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm border-2 border-primary px-8 py-6 rounded-2xl flex flex-col items-center text-center animate-pulse">
                  <h1 className="font-display text-7xl text-white">
                    SCAN TO PLAY
                  </h1>
                  <p className="text-primary text-2xl font-bold tracking-widest mt-2">
                    3 SHOTS TO SCORE BIG
                  </p>
                  <p className="text-yellow-400 text-lg font-display tracking-wider mt-2">
                    WIN PRIZES EVERY 2 HOURS
                  </p>
                </div>
              </div>
            )}

            {shotStatus === "idle" && roomCode && playerCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm border-2 border-primary px-6 py-4 rounded-2xl flex flex-col items-center text-center">
                  <h1 className="font-display text-6xl text-white">
                    WAITING FOR SHOT...
                  </h1>
                  <p className="text-primary text-xl font-bold tracking-widest mt-2">
                    SWIPE UP ON YOUR PHONE
                  </p>
                </div>
              </div>
            )}

            {shotStatus === "shooting" && (
              <motion.div
                className="absolute top-4 left-0 right-0 text-center pointer-events-none z-30"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="font-display text-3xl text-yellow-400">
                  {currentShooter} — SHOT {shotInfo.shotNumber} OF {shotInfo.maxShots}
                </p>
              </motion.div>
            )}

            {shotStatus === "goal" && (
              <>
                <GoalCelebration show={true} />
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-50"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: [0.5, 1.15, 1] }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                >
                  <div className="text-center">
                    <motion.h1
                      className="font-display text-[12rem] text-primary leading-none italic"
                      animate={{
                        textShadow: [
                          "0 0 40px rgba(0,255,102,1), 0 0 80px rgba(0,255,102,0.5)",
                          "0 0 60px rgba(0,255,102,1), 0 0 120px rgba(0,255,102,0.7)",
                          "0 0 40px rgba(0,255,102,1), 0 0 80px rgba(0,255,102,0.5)",
                        ],
                      }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      GOAL!!!
                    </motion.h1>
                    <motion.p
                      className="font-display text-4xl text-white mt-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      {currentShooter} — {shotInfo.totalScore} PTS (Shot {shotInfo.shotNumber}/{shotInfo.maxShots})
                    </motion.p>
                  </div>
                </motion.div>
              </>
            )}

            {shotStatus === "miss" && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="text-center">
                  <h1 className="font-display text-[10rem] text-destructive leading-none drop-shadow-[0_0_40px_rgba(255,0,0,0.8)] italic">
                    SAVED
                  </h1>
                  <p className="font-display text-3xl text-neutral-300 mt-2">
                    {currentShooter} — Shot {shotInfo.shotNumber}/{shotInfo.maxShots}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          <div className="px-8 pb-4">
            <div className="bg-black/40 backdrop-blur-sm rounded-xl px-6 py-2 border border-neutral-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" />
                <span className="text-neutral-400 text-sm font-display tracking-wider">2-HOUR PRIZE WINDOW</span>
              </div>
              <div className="text-neutral-500 text-xs">
                Highest score wins grand prize • Spot prizes during activation
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-1 border border-white/10">
                <span className="text-neutral-400 text-[10px] tracking-widest uppercase">Sponsored by</span>
                <span className="text-white font-display text-sm ml-2 tracking-wider">YOUR BRAND</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { Trophy, Users, Gift } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import GoalCelebration from "@/components/GoalCelebration";
import Goalie from "@/components/Goalie";
import StadiumBackground from "@/components/StadiumBackground";

type GoalieState = "idle" | "ready" | "diving-left" | "diving-right" | "celebrate";

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
    <div className="h-screen w-full text-white overflow-hidden relative bg-[#1a0e30]">
      <StadiumBackground />

      <div className="absolute inset-0 pointer-events-none" style={{
        background: "linear-gradient(180deg, rgba(26,14,48,0.7) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%)"
      }} />

      <div className="absolute top-0 left-0 right-0 h-[3px] z-50" style={{
        background: "linear-gradient(90deg, transparent, #D4A843 20%, #F5D780 50%, #D4A843 80%, transparent)"
      }} />

      <div className="absolute inset-0 flex flex-col z-10">

        <div className="flex justify-between items-start px-10 pt-6 pb-2">
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-3 mb-1">
                <svg viewBox="0 0 40 40" className="w-12 h-12" fill="none">
                  <circle cx="20" cy="20" r="18" stroke="#D4A843" strokeWidth="2" fill="none" />
                  <circle cx="20" cy="20" r="14" stroke="#D4A843" strokeWidth="1" fill="none" opacity="0.4" />
                  <path d="M20 6 L20 14 M20 26 L20 34 M6 20 L14 20 M26 20 L34 20" stroke="#D4A843" strokeWidth="1.5" opacity="0.6" />
                  <circle cx="20" cy="20" r="5" fill="#D4A843" opacity="0.3" />
                </svg>
                <div>
                  <p className="text-[#D4A843] text-xs tracking-[0.4em] uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    FIFA WORLD CUP
                  </p>
                  <p className="text-white text-3xl leading-none tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    USA | MEX | CAN 2026
                  </p>
                </div>
              </div>
            </div>

            <div className="h-14 w-px bg-gradient-to-b from-transparent via-[#D4A843]/40 to-transparent" />

            <div>
              <h1 className="text-6xl text-white leading-none tracking-[0.05em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                SHOOT FOR <span className="fifa-gradient-text">GLORY</span>
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-[#D4A843] text-lg tracking-[0.3em] uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  LIVE PENALTY CHALLENGE
                </span>
                {playerCount > 0 && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-[#D4A843]" />
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#D4A843]" />
                      <span className="text-white/70 text-sm tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {playerCount} PLAYER{playerCount !== 1 ? "S" : ""} LIVE
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4">
            {roomCode && (
              <div className="relative animate-pulse-glow rounded-2xl">
                <div className="bg-white rounded-2xl p-4 flex flex-col items-center">
                  <QRCodeSVG
                    value={mobileUrl}
                    size={150}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#1a0610"
                  />
                  <div className="mt-2 text-center">
                    <p className="text-[#56042C] text-sm tracking-[0.3em] font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      SCAN TO PLAY
                    </p>
                    <p className="text-neutral-600 text-2xl tracking-[0.5em] font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      {roomCode}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-black/40 backdrop-blur-md border border-[#D4A843]/20 rounded-2xl p-5 min-w-[280px] max-h-[340px]">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-5 h-5 text-[#D4A843]" />
                <h3
                  data-testid="text-billboard-leaderboard-title"
                  className="text-xl tracking-[0.25em] text-[#D4A843]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                >
                  LEADERBOARD
                </h3>
              </div>
              <div className="space-y-2">
                {leaderboard.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-6 tracking-wider">
                    Scan QR code to be first!
                  </p>
                )}
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <motion.div
                    key={entry.playerId}
                    data-testid={`row-billboard-leaderboard-${i}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex justify-between items-center px-4 py-2 rounded-lg ${
                      i === 0
                        ? "bg-gradient-to-r from-[#D4A843]/30 to-transparent border border-[#D4A843]/30 text-[#D4A843]"
                        : "bg-white/5 text-white/80"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="text-lg font-bold" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                      </span>
                      <div className="truncate">
                        <span className="font-semibold text-sm">{entry.playerName}</span>
                        {entry.province && (
                          <span className="text-white/30 text-xs ml-1.5">• {entry.province}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl flex-shrink-0" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      {entry.totalPoints}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-end pb-16 relative">
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[5]">
            <Goalie state={goalieState} scale={1.4} jerseyColor="#56042C" jerseyAccent="#3a0220" jerseyText="SPONSOR" />
          </div>

          <motion.div
            className="relative z-20 w-36 h-36"
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

          <AnimatePresence mode="wait">
            {shotStatus === "idle" && !roomCode && (
              <motion.div
                key="connecting"
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-2 border-[#D4A843]/30 border-t-[#D4A843] rounded-full mx-auto mb-6"
                  />
                  <h1 className="text-6xl text-white tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    CONNECTING
                  </h1>
                </div>
              </motion.div>
            )}

            {shotStatus === "idle" && roomCode && playerCount === 0 && (
              <motion.div
                key="scan"
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center max-w-2xl">
                  <motion.h1
                    className="text-[8rem] leading-none tracking-[0.05em] text-white"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    SCAN TO <span className="fifa-gradient-text">PLAY</span>
                  </motion.h1>
                  <div className="flex items-center justify-center gap-6 mt-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#D4A843]/40" />
                    <p className="text-[#D4A843] text-2xl tracking-[0.3em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      3 SHOTS TO WIN
                    </p>
                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#D4A843]/40" />
                  </div>
                  <motion.p
                    className="text-white/40 text-xl tracking-[0.2em] mt-3"
                    style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    PRIZES AWARDED EVERY 2 HOURS
                  </motion.p>
                </div>
              </motion.div>
            )}

            {shotStatus === "idle" && roomCode && playerCount > 0 && (
              <motion.div
                key="waiting"
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-[10]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center">
                  <motion.div
                    className="flex items-center justify-center gap-3 mb-4"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <div className="w-3 h-3 rounded-full bg-primary" style={{ animationDelay: "0.3s" }} />
                    <div className="w-3 h-3 rounded-full bg-primary" style={{ animationDelay: "0.6s" }} />
                  </motion.div>
                  <h1 className="text-7xl text-white tracking-[0.1em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    WAITING FOR SHOT
                  </h1>
                  <p className="text-[#D4A843] text-2xl tracking-[0.3em] mt-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    SWIPE UP ON YOUR PHONE
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {shotStatus === "shooting" && (
            <motion.div
              className="absolute top-2 left-0 right-0 text-center pointer-events-none z-30"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <div className="inline-flex items-center gap-4 bg-black/60 backdrop-blur-sm border border-[#D4A843]/30 rounded-full px-8 py-3">
                <span className="text-4xl text-white tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  {currentShooter}
                </span>
                <div className="h-6 w-px bg-[#D4A843]/40" />
                <span className="text-2xl text-[#D4A843] tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                  SHOT {shotInfo.shotNumber} OF {shotInfo.maxShots}
                </span>
              </div>
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
                    className="leading-none italic"
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "14rem",
                      letterSpacing: "0.05em",
                    }}
                    animate={{
                      textShadow: [
                        "0 0 40px rgba(0,255,102,1), 0 0 80px rgba(0,255,102,0.5)",
                        "0 0 60px rgba(0,255,102,1), 0 0 120px rgba(0,255,102,0.7)",
                        "0 0 40px rgba(0,255,102,1), 0 0 80px rgba(0,255,102,0.5)",
                      ],
                      color: ["#00ff66", "#66ffaa", "#00ff66"],
                    }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    GOAL!!!
                  </motion.h1>
                  <motion.div
                    className="mt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <span className="text-5xl text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      {currentShooter}
                    </span>
                    <span className="text-4xl text-[#D4A843] ml-4" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                      {shotInfo.totalScore} PTS
                    </span>
                  </motion.div>
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
                <h1
                  className="leading-none italic"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "12rem",
                    letterSpacing: "0.05em",
                    color: "hsl(0, 84%, 60%)",
                    textShadow: "0 0 40px rgba(255,0,0,0.6), 0 0 80px rgba(255,0,0,0.3)",
                  }}
                >
                  SAVED!
                </h1>
                <p className="text-3xl text-white/60 mt-1" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.15em" }}>
                  {currentShooter} — Shot {shotInfo.shotNumber}/{shotInfo.maxShots}
                </p>
              </div>
            </motion.div>
          )}
        </div>

        <div className="px-10 pb-4">
          <div className="flex items-center justify-between bg-black/30 backdrop-blur-sm rounded-xl border border-[#D4A843]/10 px-6 py-2.5">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-[#D4A843]" />
              <span className="text-[#D4A843] text-lg tracking-[0.2em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                2-HOUR PRIZE WINDOW
              </span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-white/40 text-sm tracking-wider">
                Grand prize for highest scorer • Spot prizes during activation
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-3">
                <span className="text-white/30 text-xs tracking-[0.2em] uppercase">Presented by</span>
                <div className="bg-white/10 border border-white/10 rounded-lg px-5 py-1.5">
                  <span className="text-white text-lg tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                    YOUR BRAND
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] z-50" style={{
        background: "linear-gradient(90deg, transparent, #D4A843 20%, #F5D780 50%, #D4A843 80%, transparent)"
      }} />
    </div>
  );
}

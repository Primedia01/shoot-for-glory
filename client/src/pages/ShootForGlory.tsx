import React, { useState, useEffect } from "react";
import { motion, useAnimation, PanInfo } from "framer-motion";
import { Trophy, ArrowUp, Zap, Target, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import GoalCelebration from "@/components/GoalCelebration";
import Goalie from "@/components/Goalie";

type GoalieState = "idle" | "ready" | "diving-left" | "diving-right" | "celebrate";

const stadiumBg = "/stadium-bg.jpg";
const soccerBall = "/soccer-ball.png";

type ShotStatus = "idle" | "shooting" | "goal" | "miss";

interface LeaderboardEntry {
  playerId: string;
  username: string;
  totalPoints: number;
}

export default function ShootForGlory() {
  const [shotStatus, setShotStatus] = useState<ShotStatus>("idle");
  const [power, setPower] = useState(0);
  const [playerId, setPlayerId] = useState<string | null>(() => localStorage.getItem("playerId"));
  const [playerName, setPlayerName] = useState("");
  const [showRegister, setShowRegister] = useState(!playerId);
  const [goalieState, setGoalieState] = useState<GoalieState>("idle");

  const queryClient = useQueryClient();
  const billboardBallControls = useAnimation();

  const { data: leaderboard = [] } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard"],
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const { data: playerScore } = useQuery<{ score: number }>({
    queryKey: ["/api/players", playerId, "score"],
    enabled: !!playerId,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const registerMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", "/api/players", { username });
      return res.json();
    },
    onSuccess: (data) => {
      setPlayerId(data.id);
      localStorage.setItem("playerId", data.id);
      setShowRegister(false);
    },
  });

  const shotMutation = useMutation({
    mutationFn: async (shot: { power: number; angle: number; isGoal: number; points: number }) => {
      const res = await apiRequest("POST", "/api/shots", {
        playerId,
        ...shot,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "score"] });
    },
  });

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

  const handleSwipeEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y < -100 || info.velocity.y < -500) {
      const isGoal = Math.abs(info.offset.x) < 150;
      const shotPower = Math.min(Math.abs(Math.round(info.velocity.y / 10)), 100);
      const shotAngle = Math.round(info.offset.x);
      const points = isGoal ? 100 : 0;

      setPower(shotPower);
      setShotStatus("shooting");

      shotMutation.mutate({ power: shotPower, angle: shotAngle, isGoal: isGoal ? 1 : 0, points });

      const ballGoesRight = info.offset.x > 0;
      if (isGoal) {
        setGoalieState(ballGoesRight ? "diving-left" : "diving-right");
        billboardBallControls.start({
          y: -180,
          x: info.offset.x * 0.8,
          scale: 0.35,
          transition: { duration: 0.45, ease: "easeOut" },
        }).then(() => {
          billboardBallControls.start({
            y: -160,
            scale: 0.3,
            transition: { duration: 0.2, type: "spring", bounce: 0.4 },
          });
          setShotStatus("goal");
        });
      } else {
        setGoalieState(ballGoesRight ? "diving-right" : "diving-left");
        billboardBallControls.start({
          y: -350,
          x: info.offset.x * 2.5,
          scale: 0.2,
          opacity: 0.6,
          transition: { duration: 0.5, ease: "easeOut" },
        }).then(() => {
          setShotStatus("miss");
          setGoalieState("celebrate");
        });
      }
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      registerMutation.mutate(playerName.trim());
    }
  };

  const currentPlayerEntry = leaderboard.find((e) => e.playerId === playerId);
  const currentRank = leaderboard.findIndex((e) => e.playerId === playerId) + 1;
  const myScore = playerScore?.score ?? currentPlayerEntry?.totalPoints ?? 0;

  if (showRegister) {
    return (
      <div className="flex h-screen w-full bg-black text-white items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${stadiumBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
        <Card className="relative z-10 bg-black/70 backdrop-blur-xl border-neutral-800 p-10 max-w-md w-full mx-4">
          <div className="flex items-center gap-3 mb-6 text-primary">
            <Zap className="w-7 h-7 fill-primary" />
            <h1 className="font-display text-4xl tracking-wider">SHOOT FOR GLORY</h1>
          </div>
          <p className="text-neutral-400 mb-8">Enter your name to step up to the penalty spot and compete on the big screen.</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <Input
                data-testid="input-username"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your display name"
                className="pl-11 bg-neutral-900 border-neutral-700 text-white h-12 text-lg"
              />
            </div>
            <Button
              data-testid="button-register"
              type="submit"
              className="w-full h-12 text-lg font-display tracking-widest"
              disabled={registerMutation.isPending || !playerName.trim()}
            >
              {registerMutation.isPending ? "JOINING..." : "ENTER THE ARENA"}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-black text-white overflow-hidden">

      {/* LEFT SIDE: MOBILE INTERFACE */}
      <div className="w-[400px] flex-shrink-0 bg-neutral-950 border-r border-neutral-800 p-8 flex flex-col relative z-20 shadow-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Zap className="w-5 h-5 fill-primary" />
            <span className="font-display tracking-widest text-xl">LIVE SYNC</span>
          </div>
          <h1 className="text-3xl font-display leading-none mb-2">Shoot for Glory</h1>
          <p className="text-neutral-400 text-sm">Swipe up to take your penalty on the big screen.</p>
        </div>

        {/* Phone Frame */}
        <div className="flex-1 rounded-[2.5rem] border-4 border-neutral-800 bg-neutral-900 relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,255,102,0.1)]">
          <div className="h-6 w-full flex justify-center pt-2">
            <div className="w-20 h-4 bg-neutral-950 rounded-full"></div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-end pb-12 relative">
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <Target className="w-48 h-48" />
            </div>

            <div className="absolute top-1/4 w-full text-center px-4">
              {shotStatus === "idle" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 text-neutral-400"
                >
                  <ArrowUp className="w-8 h-8 animate-bounce text-primary" />
                  <span className="font-display text-2xl uppercase tracking-widest text-primary">Swipe to Shoot</span>
                </motion.div>
              )}
              {shotStatus === "shooting" && (
                <h2 className="font-display text-4xl text-yellow-400 animate-pulse">Power: {power}%</h2>
              )}
              {shotStatus === "goal" && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-6xl text-primary drop-shadow-[0_0_15px_rgba(0,255,102,0.8)]"
                >
                  GOAL!
                </motion.div>
              )}
              {shotStatus === "miss" && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="font-display text-5xl text-destructive"
                >
                  MISSED
                </motion.div>
              )}
            </div>

            {shotStatus === "idle" ? (
              <motion.div
                data-testid="ball-draggable"
                className="w-24 h-24 rounded-full cursor-grab active:cursor-grabbing relative z-10"
                drag
                dragConstraints={{ left: -50, right: 50, top: -300, bottom: 0 }}
                onDragEnd={handleSwipeEnd}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <img src={soccerBall} alt="Soccer Ball" className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
              </motion.div>
            ) : (
              <div className="w-24 h-24 opacity-20 transition-opacity duration-1000">
                <img src={soccerBall} alt="Soccer Ball Ghost" className="w-full h-full object-contain blur-sm" />
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none rounded-b-[2rem]" />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: DOOH BILLBOARD */}
      <div className="flex-1 relative bg-neutral-900 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-60"
          style={{ backgroundImage: `url(${stadiumBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />

        <div className="absolute inset-0 flex flex-col p-12 z-10">
          <div className="flex justify-between items-start w-full">
            <div>
              <h2 className="font-display text-6xl text-white tracking-wider leading-none drop-shadow-lg">
                PRIMEDIA <span className="text-primary block text-3xl">LIVE PENALTY ZONE</span>
              </h2>
            </div>

            <Card className="bg-black/60 backdrop-blur-md border-neutral-800 p-6 min-w-[300px]">
              <div className="flex items-center gap-3 mb-4 text-primary">
                <Trophy className="w-6 h-6" />
                <h3 data-testid="text-leaderboard-title" className="font-display text-2xl tracking-widest">LEADERBOARD</h3>
              </div>
              <div className="space-y-3">
                {leaderboard.length === 0 && (
                  <p className="text-neutral-500 text-sm text-center py-4">No shots taken yet. Be the first!</p>
                )}
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div
                    key={entry.playerId}
                    data-testid={`row-leaderboard-${i}`}
                    className={`flex justify-between items-center px-4 py-2 rounded ${
                      entry.playerId === playerId
                        ? "bg-primary/20 text-primary"
                        : i === 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <span className="font-bold">{i + 1}. @{entry.username}</span>
                    <span className="font-display text-2xl">{entry.totalPoints}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Goal Net Area */}
          <div className="flex-1 flex flex-col items-center justify-end pb-20 relative">
            <div className="absolute bottom-10 w-[800px] h-[350px] border-t-8 border-x-8 border-white/80 rounded-t-lg shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <div className="w-full h-full opacity-30" style={{
                backgroundImage: 'linear-gradient(45deg, #fff 1px, transparent 1px), linear-gradient(-45deg, #fff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
              }} />
            </div>

            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-15">
              <Goalie state={goalieState} scale={1.2} />
            </div>

            <motion.div
              className="relative z-20 w-32 h-32"
              initial={{ y: 0, scale: 1, opacity: 1 }}
              animate={billboardBallControls}
            >
              {shotStatus !== "idle" && (
                <img src={soccerBall} alt="Billboard Ball" className="w-full h-full object-contain" />
              )}
            </motion.div>

            {shotStatus === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm border-2 border-primary px-8 py-6 rounded-2xl flex flex-col items-center text-center animate-pulse">
                  <h1 className="font-display text-7xl text-white">SCAN TO PLAY</h1>
                  <p className="text-primary text-2xl font-bold tracking-widest mt-2">QR CODE OR CONNECT DEVICE</p>
                </div>
              </div>
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
                      className="font-display text-5xl text-white mt-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      +100 POINTS
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
                  <h1 className="font-display text-[10rem] text-destructive leading-none drop-shadow-[0_0_40px_rgba(255,0,0,0.8)] italic">SAVED</h1>
                  <p className="font-display text-4xl text-neutral-300 mt-4">NICE TRY. SWIPE TO GO AGAIN.</p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Player score bar */}
          {playerId && (
            <div className="absolute bottom-4 left-12 right-12 flex justify-between items-center bg-black/60 backdrop-blur-sm rounded-xl px-6 py-3 border border-neutral-800">
              <span className="text-neutral-400">Your Score</span>
              <span data-testid="text-player-score" className="font-display text-3xl text-primary">{myScore}</span>
              {currentRank > 0 && <span className="text-neutral-400">Rank #{currentRank}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

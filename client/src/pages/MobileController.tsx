import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import { ArrowUp, Zap, Target, User, Phone, MapPin, Shield, Wifi, WifiOff, Trophy, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GoalCelebration from "@/components/GoalCelebration";

const soccerBall = "/soccer-ball.png";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
  "Western Cape",
];

type ShotStatus = "idle" | "shooting" | "goal" | "miss";
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
type GamePhase = "register" | "playing" | "game_over";

interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  totalPoints: number;
  province: string;
}

export default function MobileController() {
  const [playerName, setPlayerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [province, setProvince] = useState("");
  const [consent, setConsent] = useState(false);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [shotStatus, setShotStatus] = useState<ShotStatus>("idle");
  const [power, setPower] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [shotsRemaining, setShotsRemaining] = useState(3);
  const [maxShots, setMaxShots] = useState(3);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [errorMessage, setErrorMessage] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gamePhase, setGamePhase] = useState<GamePhase>("register");
  const wsRef = useRef<WebSocket | null>(null);

  const params = new URLSearchParams(window.location.search);
  const roomFromUrl = params.get("room");

  useEffect(() => {
    if (roomFromUrl) {
      setRoomCode(roomFromUrl.toUpperCase());
    }
  }, [roomFromUrl]);

  const connectToRoom = useCallback((code: string, data: { playerName: string; mobile: string; province: string; consent: boolean }) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;
    setConnectionStatus("connecting");
    setErrorMessage("");

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "join_room",
        roomCode: code.toUpperCase(),
        ...data,
      }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "joined":
          setPlayerId(msg.playerId);
          setConnectionStatus("connected");
          setShotsRemaining(msg.shotsRemaining);
          setMaxShots(msg.maxShots);
          setLeaderboard(msg.leaderboard || []);
          setGamePhase("playing");
          break;
        case "error":
          setConnectionStatus("error");
          setErrorMessage(msg.message);
          break;
        case "shot_result":
          setShotStatus(msg.isGoal ? "goal" : "miss");
          setTotalScore(msg.totalScore);
          setShotsRemaining(msg.shotsRemaining);
          setLeaderboard(msg.leaderboard || []);
          break;
        case "leaderboard_update":
          setLeaderboard(msg.leaderboard || []);
          break;
        case "game_over":
          setTotalScore(msg.totalScore);
          setLeaderboard(msg.leaderboard || []);
          setGamePhase("game_over");
          break;
        case "room_closed":
          setConnectionStatus("disconnected");
          setErrorMessage("The screen session has ended.");
          setGamePhase("register");
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
    if (shotStatus !== "idle" || shotsRemaining <= 0) return;
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
    if (playerName.trim() && code.trim() && province) {
      connectToRoom(code.trim(), {
        playerName: playerName.trim(),
        mobile: mobile.trim(),
        province,
        consent,
      });
    }
  };

  const currentRank = leaderboard.findIndex(e => e.playerId === playerId) + 1;
  const shotsTaken = maxShots - shotsRemaining;

  if (gamePhase === "register") {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-neutral-950 text-white">
        <div className="bg-black/50 border-b border-neutral-800 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Zap className="w-5 h-5 fill-primary" />
            <span className="font-display tracking-widest text-xl">SHOOT FOR GLORY</span>
          </div>
          <p className="text-neutral-500 text-xs mt-1">FIFA World Cup 2026 Experience</p>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-6 overflow-y-auto">
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center mb-4">
              <h2 className="font-display text-2xl text-white tracking-wider">STEP UP TO THE SPOT</h2>
              <p className="text-neutral-400 text-sm mt-1">Enter your details to play</p>
            </div>

            <Card className="bg-neutral-900/80 backdrop-blur border-neutral-800 p-5">
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    data-testid="input-mobile-username"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Your name"
                    className="pl-10 bg-neutral-900 border-neutral-700 text-white h-11"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    data-testid="input-mobile-number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Mobile number"
                    type="tel"
                    className="pl-10 bg-neutral-900 border-neutral-700 text-white h-11"
                    autoComplete="off"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <select
                    data-testid="select-province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full pl-10 pr-4 h-11 bg-neutral-900 border border-neutral-700 text-white rounded-md appearance-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <Input
                    data-testid="input-room-code"
                    value={roomCode || manualCode}
                    onChange={(e) => {
                      if (roomCode) return;
                      setManualCode(e.target.value.toUpperCase());
                    }}
                    placeholder="Room code (on screen)"
                    className="pl-10 bg-neutral-900 border-neutral-700 text-white h-11 tracking-[0.3em] uppercase"
                    maxLength={4}
                    readOnly={!!roomCode}
                    autoComplete="off"
                    required
                  />
                </div>

                <label
                  data-testid="label-consent"
                  className="flex items-start gap-3 p-3 bg-neutral-800/50 rounded-lg cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-primary"
                  />
                  <span className="text-neutral-400 text-xs leading-relaxed">
                    I agree to receive promotional communications and updates about future activations and prizes.
                  </span>
                </label>

                {errorMessage && (
                  <p data-testid="text-error" className="text-destructive text-sm text-center">{errorMessage}</p>
                )}

                <Button
                  data-testid="button-join"
                  type="submit"
                  className="w-full h-11 text-lg font-display tracking-widest"
                  disabled={connectionStatus === "connecting" || !playerName.trim() || !province || !(roomCode || manualCode).trim()}
                >
                  {connectionStatus === "connecting" ? "CONNECTING..." : "PLAY NOW"}
                </Button>
              </form>
            </Card>

            <div className="flex items-center gap-2 justify-center text-neutral-600 text-xs">
              <Shield className="w-3 h-3" />
              <span>Your data is handled securely</span>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900/50 border-t border-neutral-800 px-4 py-2 text-center">
          <div className="h-8 flex items-center justify-center">
            <span className="text-neutral-600 text-[10px] tracking-widest uppercase">Powered by your brand</span>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === "game_over") {
    return (
      <div className="flex flex-col min-h-[100dvh] bg-neutral-950 text-white">
        <div className="bg-black/50 border-b border-neutral-800 px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Trophy className="w-5 h-5" />
            <span className="font-display tracking-widest text-xl">GAME OVER</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-6 w-full max-w-sm"
          >
            <div>
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="font-display text-4xl text-white">NICE WORK!</h2>
              <p className="text-neutral-400 mt-2">You've used all {maxShots} shots</p>
            </div>

            <Card className="bg-neutral-900/80 backdrop-blur border-neutral-800 p-6">
              <p className="text-neutral-400 text-sm mb-1">YOUR FINAL SCORE</p>
              <p data-testid="text-final-score" className="font-display text-6xl text-primary">{totalScore}</p>
              {currentRank > 0 && (
                <p className="text-neutral-400 mt-2">Rank <span className="text-white font-bold">#{currentRank}</span> on the leaderboard</p>
              )}
            </Card>

            <Card className="bg-neutral-900/80 backdrop-blur border-neutral-800 p-4">
              <h3 className="font-display text-lg text-primary tracking-widest mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4" /> LEADERBOARD
              </h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div
                    key={entry.playerId}
                    data-testid={`row-final-leaderboard-${i}`}
                    className={`flex justify-between items-center px-3 py-2 rounded text-sm ${
                      entry.playerId === playerId
                        ? "bg-primary/20 text-primary"
                        : i === 0
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    <span className="truncate mr-2">{i + 1}. {entry.playerName}</span>
                    <span className="font-display text-lg flex-shrink-0">{entry.totalPoints}</span>
                  </div>
                ))}
              </div>
            </Card>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
              <p className="font-display text-lg text-primary tracking-wider">WIN PRIZES!</p>
              <p className="text-neutral-400 text-sm mt-1">
                Top scorer in this 2-hour window wins the grand prize. Spot prizes awarded during the activation!
              </p>
            </div>
          </motion.div>
        </div>

        <div className="bg-neutral-900/50 border-t border-neutral-800 px-4 py-2 text-center">
          <div className="h-8 flex items-center justify-center">
            <span className="text-neutral-600 text-[10px] tracking-widest uppercase">Powered by your brand</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-neutral-950 text-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          {connectionStatus === "connected" ? (
            <><Wifi className="w-3 h-3 text-primary" /><span className="text-primary text-xs font-display tracking-wider">LIVE</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-destructive" /><span className="text-destructive text-xs">OFFLINE</span></>
          )}
        </div>
        <div className="flex items-center gap-1">
          {Array.from({ length: maxShots }).map((_, i) => (
            <div
              key={i}
              data-testid={`shot-indicator-${i}`}
              className={`w-3 h-3 rounded-full border ${
                i < shotsTaken
                  ? "bg-primary border-primary"
                  : "bg-transparent border-neutral-600"
              }`}
            />
          ))}
        </div>
        <div className="text-right">
          <span className="font-display text-lg text-primary">{totalScore}</span>
          <span className="text-neutral-500 text-[10px] ml-1">PTS</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end pb-14 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <Target className="w-64 h-64" />
        </div>

        <div className="absolute top-[20%] w-full text-center px-4">
          {shotStatus === "idle" && shotsRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-2 text-neutral-400"
            >
              <ArrowUp className="w-10 h-10 animate-bounce text-primary" />
              <span className="font-display text-3xl uppercase tracking-widest text-primary">
                Swipe to Shoot
              </span>
              <span className="text-neutral-500 text-sm">
                Shot {shotsTaken + 1} of {maxShots}
              </span>
            </motion.div>
          )}
          {shotStatus === "shooting" && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
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
                {shotsRemaining > 0 && (
                  <p className="text-neutral-400 text-sm mt-2">{shotsRemaining} shot{shotsRemaining !== 1 ? "s" : ""} remaining</p>
                )}
              </motion.div>
            </>
          )}
          {shotStatus === "miss" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="font-display text-6xl text-destructive">SAVED!</div>
              {shotsRemaining > 0 ? (
                <div className="text-neutral-400 mt-2">{shotsRemaining} shot{shotsRemaining !== 1 ? "s" : ""} remaining</div>
              ) : (
                <div className="text-neutral-400 mt-2">No shots left</div>
              )}
            </motion.div>
          )}
        </div>

        {shotStatus === "idle" && shotsRemaining > 0 ? (
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
        <div className="px-3 pb-2">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-neutral-800 flex justify-between items-center">
            <span className="text-neutral-400 text-xs">Rank</span>
            <span className="font-display text-lg text-primary">#{currentRank}</span>
          </div>
        </div>
      )}
    </div>
  );
}

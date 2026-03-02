import { useState, useEffect, useRef, useCallback } from "react";
import { motion, PanInfo } from "framer-motion";
import { ArrowUp, User, Phone, MapPin, Shield, Wifi, WifiOff, Trophy, CheckCircle } from "lucide-react";
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
      <div className="flex flex-col min-h-[100dvh] fifa-gradient-bg text-white">
        <div className="h-[2px] w-full" style={{
          background: "linear-gradient(90deg, transparent, #D4A843 30%, #F5D780 50%, #D4A843 70%, transparent)"
        }} />
        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-0.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#D4A843" strokeWidth="1.5" fill="none" />
              <circle cx="12" cy="12" r="3" fill="#D4A843" opacity="0.4" />
            </svg>
            <span className="text-[#D4A843] text-xs tracking-[0.4em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              FIFA WORLD CUP 2026
            </span>
          </div>
          <h1 className="text-2xl text-white tracking-[0.1em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
            SHOOT FOR <span className="fifa-gradient-text">GLORY</span>
          </h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 overflow-y-auto">
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center mb-3">
              <h2 className="text-3xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                STEP UP TO THE SPOT
              </h2>
              <p className="text-white/40 text-sm mt-1">Enter your details to play</p>
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-5">
              <form onSubmit={handleJoin} className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A843]/60" />
                  <Input
                    data-testid="input-mobile-username"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Your name"
                    className="pl-10 bg-white/5 border-white/10 text-white h-12 rounded-xl placeholder:text-white/25 focus:border-[#D4A843]/50"
                    autoComplete="off"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A843]/60" />
                  <Input
                    data-testid="input-mobile-number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Mobile number"
                    type="tel"
                    className="pl-10 bg-white/5 border-white/10 text-white h-12 rounded-xl placeholder:text-white/25 focus:border-[#D4A843]/50"
                    autoComplete="off"
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A843]/60" />
                  <select
                    data-testid="select-province"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full pl-10 pr-4 h-12 bg-white/5 border border-white/10 text-white rounded-xl appearance-none cursor-pointer focus:border-[#D4A843]/50"
                    required
                  >
                    <option value="" disabled className="bg-[#1a0610]">Select province</option>
                    {PROVINCES.map((p) => (
                      <option key={p} value={p} className="bg-[#1a0610]">{p}</option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A843]/60" />
                  <Input
                    data-testid="input-room-code"
                    value={roomCode || manualCode}
                    onChange={(e) => {
                      if (roomCode) return;
                      setManualCode(e.target.value.toUpperCase());
                    }}
                    placeholder="Room code"
                    className="pl-10 bg-white/5 border-white/10 text-white h-12 rounded-xl tracking-[0.3em] uppercase placeholder:text-white/25 focus:border-[#D4A843]/50"
                    maxLength={4}
                    readOnly={!!roomCode}
                    autoComplete="off"
                    required
                  />
                </div>

                <label
                  data-testid="label-consent"
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-xl cursor-pointer border border-white/5"
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#D4A843]"
                  />
                  <span className="text-white/40 text-xs leading-relaxed">
                    I agree to receive promotional communications and updates about future activations and prizes.
                  </span>
                </label>

                {errorMessage && (
                  <p data-testid="text-error" className="text-destructive text-sm text-center">{errorMessage}</p>
                )}

                <Button
                  data-testid="button-join"
                  type="submit"
                  className="w-full h-12 text-lg tracking-[0.2em] rounded-xl font-bold"
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    background: "linear-gradient(135deg, #D4A843 0%, #B8892E 100%)",
                    color: "#1a0610",
                  }}
                  disabled={connectionStatus === "connecting" || !playerName.trim() || !province || !(roomCode || manualCode).trim()}
                >
                  {connectionStatus === "connecting" ? "CONNECTING..." : "PLAY NOW"}
                </Button>
              </form>
            </div>

            <div className="flex items-center gap-2 justify-center text-white/20 text-xs">
              <Shield className="w-3 h-3" />
              <span>Your data is handled securely</span>
            </div>
          </div>
        </div>

        <div className="px-4 py-2 text-center border-t border-white/5">
          <div className="h-7 flex items-center justify-center gap-2">
            <span className="text-white/20 text-[10px] tracking-[0.2em] uppercase">Powered by</span>
            <span className="text-white/40 text-xs tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>YOUR BRAND</span>
          </div>
        </div>
        <div className="h-[2px] w-full" style={{
          background: "linear-gradient(90deg, transparent, #D4A843 30%, #F5D780 50%, #D4A843 70%, transparent)"
        }} />
      </div>
    );
  }

  if (gamePhase === "game_over") {
    return (
      <div className="flex flex-col min-h-[100dvh] fifa-gradient-bg text-white">
        <div className="h-[2px] w-full" style={{
          background: "linear-gradient(90deg, transparent, #D4A843 30%, #F5D780 50%, #D4A843 70%, transparent)"
        }} />
        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-[#D4A843]" />
            <span className="text-2xl text-white tracking-[0.1em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              GAME OVER
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 overflow-y-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-5 w-full max-w-sm"
          >
            <div>
              <CheckCircle className="w-14 h-14 text-[#D4A843] mx-auto mb-3" />
              <h2 className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                FULL TIME!
              </h2>
              <p className="text-white/40 mt-1 text-sm">All {maxShots} shots taken</p>
            </div>

            <div className="bg-white/5 backdrop-blur border border-[#D4A843]/20 rounded-2xl p-6">
              <p className="text-[#D4A843] text-sm tracking-[0.2em] mb-1" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                YOUR FINAL SCORE
              </p>
              <p data-testid="text-final-score" className="text-6xl fifa-gradient-text" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {totalScore}
              </p>
              {currentRank > 0 && (
                <p className="text-white/40 mt-2 text-sm">
                  Rank <span className="text-white font-bold">#{currentRank}</span> on the leaderboard
                </p>
              )}
            </div>

            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-4">
              <h3 className="text-lg text-[#D4A843] tracking-[0.2em] mb-3 flex items-center gap-2" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                <Trophy className="w-4 h-4" /> LEADERBOARD
              </h3>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div
                    key={entry.playerId}
                    data-testid={`row-final-leaderboard-${i}`}
                    className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm ${
                      entry.playerId === playerId
                        ? "bg-[#D4A843]/15 border border-[#D4A843]/30 text-[#D4A843]"
                        : i === 0
                        ? "bg-[#D4A843]/10 text-[#D4A843]"
                        : "bg-white/5 text-white/70"
                    }`}
                  >
                    <span className="truncate mr-2">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`} {entry.playerName}
                    </span>
                    <span className="text-lg flex-shrink-0" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{entry.totalPoints}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#D4A843]/10 border border-[#D4A843]/20 rounded-2xl p-4 text-center">
              <p className="text-lg text-[#D4A843] tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                WIN PRIZES!
              </p>
              <p className="text-white/40 text-sm mt-1">
                Top scorer in this 2-hour window wins the grand prize. Spot prizes during activation!
              </p>
            </div>
          </motion.div>
        </div>

        <div className="px-4 py-2 text-center border-t border-white/5">
          <div className="h-7 flex items-center justify-center gap-2">
            <span className="text-white/20 text-[10px] tracking-[0.2em] uppercase">Powered by</span>
            <span className="text-white/40 text-xs tracking-[0.15em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>YOUR BRAND</span>
          </div>
        </div>
        <div className="h-[2px] w-full" style={{
          background: "linear-gradient(90deg, transparent, #D4A843 30%, #F5D780 50%, #D4A843 70%, transparent)"
        }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] fifa-gradient-bg text-white overflow-hidden">
      <div className="h-[2px] w-full" style={{
        background: "linear-gradient(90deg, transparent, #D4A843 30%, #F5D780 50%, #D4A843 70%, transparent)"
      }} />
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/20">
        <div className="flex items-center gap-2">
          {connectionStatus === "connected" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-primary text-xs tracking-[0.2em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>LIVE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-destructive" />
              <span className="text-destructive text-xs">OFFLINE</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: maxShots }).map((_, i) => (
            <div
              key={i}
              data-testid={`shot-indicator-${i}`}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-300 ${
                i < shotsTaken
                  ? "bg-[#D4A843] border-[#D4A843] shadow-[0_0_8px_rgba(212,168,67,0.5)]"
                  : "bg-transparent border-white/20"
              }`}
            />
          ))}
        </div>
        <div className="text-right flex items-baseline gap-1">
          <span className="text-2xl text-[#D4A843]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{totalScore}</span>
          <span className="text-white/30 text-[10px] tracking-wider">PTS</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-end pb-14 relative">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-72 h-72" fill="none">
            <circle cx="100" cy="100" r="90" stroke="white" strokeWidth="2" />
            <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="30" stroke="white" strokeWidth="1" />
            <line x1="10" y1="100" x2="190" y2="100" stroke="white" strokeWidth="1" />
            <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        <div className="absolute top-[18%] w-full text-center px-4">
          {shotStatus === "idle" && shotsRemaining > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <ArrowUp className="w-10 h-10 animate-bounce text-[#D4A843]" />
              <span className="text-4xl text-white tracking-[0.08em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                SWIPE TO SHOOT
              </span>
              <span className="text-white/30 text-sm tracking-wider" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                SHOT {shotsTaken + 1} OF {maxShots}
              </span>
            </motion.div>
          )}
          {shotStatus === "shooting" && (
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <h2 className="text-6xl text-[#D4A843] animate-pulse" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {power}%
              </h2>
              <p className="text-white/40 text-sm tracking-wider mt-1">POWER</p>
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
                  className="text-8xl"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  animate={{
                    textShadow: [
                      "0 0 20px rgba(0,255,102,0.8)",
                      "0 0 40px rgba(0,255,102,1)",
                      "0 0 20px rgba(0,255,102,0.8)",
                    ],
                    color: ["#00ff66", "#66ffaa", "#00ff66"],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  GOAL!
                </motion.div>
                <motion.div
                  className="text-2xl text-[#D4A843]"
                  style={{ fontFamily: "'Bebas Neue', sans-serif" }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  +100 POINTS
                </motion.div>
                {shotsRemaining > 0 && (
                  <p className="text-white/40 text-sm mt-2">{shotsRemaining} shot{shotsRemaining !== 1 ? "s" : ""} remaining</p>
                )}
              </motion.div>
            </>
          )}
          {shotStatus === "miss" && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="text-7xl text-destructive" style={{ fontFamily: "'Bebas Neue', sans-serif", textShadow: "0 0 30px rgba(255,0,0,0.4)" }}>
                SAVED!
              </div>
              {shotsRemaining > 0 ? (
                <div className="text-white/40 mt-2 text-sm">{shotsRemaining} shot{shotsRemaining !== 1 ? "s" : ""} remaining</div>
              ) : (
                <div className="text-white/40 mt-2 text-sm">No shots left</div>
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
            <div className="absolute inset-0 rounded-full bg-[#D4A843]/20 blur-xl animate-pulse" />
            <img
              src={soccerBall}
              alt="Soccer Ball"
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
              draggable={false}
            />
          </motion.div>
        ) : (
          <div className="w-28 h-28 opacity-20 transition-opacity duration-500">
            <img src={soccerBall} alt="" className="w-full h-full object-contain blur-sm" draggable={false} />
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{
          background: "linear-gradient(to top, rgba(86,4,44,0.3), transparent)"
        }} />
      </div>

      {currentRank > 0 && (
        <div className="px-3 pb-2">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/10 flex justify-between items-center">
            <span className="text-white/40 text-xs tracking-wider">Rank</span>
            <span className="text-xl text-[#D4A843]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>#{currentRank}</span>
          </div>
        </div>
      )}
    </div>
  );
}

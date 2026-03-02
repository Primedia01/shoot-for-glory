import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

type GoalieState = "idle" | "ready" | "diving-left" | "diving-right" | "celebrate";

interface GoalieProps {
  state: GoalieState;
  scale?: number;
  jerseyColor?: string;
  jerseyAccent?: string;
  jerseyText?: string;
}

export default function Goalie({
  state,
  scale = 1,
  jerseyColor = "#00cc52",
  jerseyAccent = "#009940",
  jerseyText = "",
}: GoalieProps) {
  const bodyControls = useAnimation();

  useEffect(() => {
    switch (state) {
      case "idle":
        bodyControls.start({
          x: 0,
          y: 0,
          rotate: 0,
          transition: { duration: 0.3 },
        });
        break;
      case "ready":
        bodyControls.start({
          y: [0, -5, 0],
          transition: { duration: 0.4, repeat: Infinity, repeatType: "reverse" },
        });
        break;
      case "diving-left":
        bodyControls.start({
          x: -200 * scale,
          y: -20 * scale,
          rotate: -40,
          transition: { duration: 0.35, ease: "easeOut" },
        });
        break;
      case "diving-right":
        bodyControls.start({
          x: 200 * scale,
          y: -20 * scale,
          rotate: 40,
          transition: { duration: 0.35, ease: "easeOut" },
        });
        break;
      case "celebrate":
        bodyControls.start({
          x: 0,
          y: 0,
          rotate: 0,
          transition: { duration: 0.3 },
        });
        break;
    }
  }, [state, bodyControls, scale]);

  const isIdle = state === "idle" || state === "ready";
  const isCelebrate = state === "celebrate";
  const isDiving = state === "diving-left" || state === "diving-right";
  const diveDir = state === "diving-left" ? -1 : 1;

  const skinBase = "#6B3F1F";
  const skinLight = "#8B5E3C";
  const skinShadow = "#4A2A10";
  const shortsColor = "#111";
  const gloveColor = "#FFD040";
  const gloveBorder = "#CC9900";
  const bootColor = "#1a1a1a";
  const sockColor = jerseyColor;

  return (
    <motion.div
      className="relative"
      animate={bodyControls}
      style={{ width: 120 * scale, height: 170 * scale }}
    >
      <svg
        viewBox="0 0 120 170"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        style={{ filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.6))" }}
      >
        <defs>
          <radialGradient id="skinGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={skinLight} />
            <stop offset="100%" stopColor={skinBase} />
          </radialGradient>
          <linearGradient id="jerseyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={jerseyColor} />
            <stop offset="100%" stopColor={jerseyAccent} />
          </linearGradient>
          <radialGradient id="headGrad" cx="50%" cy="35%" r="55%">
            <stop offset="0%" stopColor={skinLight} />
            <stop offset="80%" stopColor={skinBase} />
            <stop offset="100%" stopColor={skinShadow} />
          </radialGradient>
        </defs>

        <ellipse cx="60" cy="22" rx="14" ry="15" fill="url(#headGrad)" />

        <path d="M46 14 Q48 4, 60 6 Q72 4, 74 14 Q72 10, 60 11 Q48 10, 46 14Z" fill="#1a1a1a" />
        <path d="M46 16 Q44 12, 46 14" fill="#1a1a1a" />
        <path d="M74 16 Q76 12, 74 14" fill="#1a1a1a" />

        <ellipse cx="53" cy="21" rx="2.5" ry="2" fill="white" />
        <ellipse cx="67" cy="21" rx="2.5" ry="2" fill="white" />
        <circle cx="53" cy="21.5" r="1.2" fill="#2D1600" />
        <circle cx="67" cy="21.5" r="1.2" fill="#2D1600" />
        <circle cx="53.4" cy="21" r="0.5" fill="white" />
        <circle cx="67.4" cy="21" r="0.5" fill="white" />

        <ellipse cx="60" cy="26" rx="2.5" ry="1.5" fill={skinShadow} opacity="0.5" />

        {isCelebrate ? (
          <path d="M54 30 Q60 34, 66 30" stroke={skinShadow} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M55 30 Q60 32, 65 30" stroke={skinShadow} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        )}

        <ellipse cx="44" cy="22" rx="3" ry="4" fill="url(#skinGrad)" />
        <ellipse cx="76" cy="22" rx="3" ry="4" fill="url(#skinGrad)" />

        <path
          d="M38 38 L38 85 Q38 92, 45 92 L75 92 Q82 92, 82 85 L82 38 Q82 34, 75 34 L45 34 Q38 34, 38 38Z"
          fill="url(#jerseyGrad)"
          stroke={jerseyAccent}
          strokeWidth="1"
        />

        <line x1="60" y1="34" x2="60" y2="42" stroke="white" strokeWidth="0.8" opacity="0.3" />
        <path d="M42 38 Q60 44, 78 38" stroke="white" strokeWidth="0.6" opacity="0.2" fill="none" />

        <rect x="44" y="62" width="32" height="18" rx="3" fill="white" opacity="0.15" />

        {jerseyText ? (
          <text
            x="60"
            y="75"
            textAnchor="middle"
            fill="white"
            fontSize="11"
            fontWeight="bold"
            fontFamily="'Teko', sans-serif"
            letterSpacing="1"
          >
            {jerseyText}
          </text>
        ) : (
          <text
            x="60"
            y="76"
            textAnchor="middle"
            fill="white"
            fontSize="18"
            fontWeight="bold"
            fontFamily="'Teko', sans-serif"
          >
            1
          </text>
        )}

        <rect x="52" y="36" width="16" height="4" rx="2" fill="white" opacity="0.2" />

        {isDiving ? (
          <>
            <path
              d={diveDir < 0
                ? "M38 48 Q20 36, 2 28"
                : "M38 48 Q30 42, 24 38"
              }
              stroke="url(#skinGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={diveDir < 0
                ? "M82 48 Q90 40, 96 34"
                : "M82 48 Q100 36, 118 28"
              }
              stroke="url(#skinGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            <rect
              x={diveDir < 0 ? -6 : 22}
              y={diveDir < 0 ? 20 : 30}
              width="12"
              height="16"
              rx="4"
              fill={gloveColor}
              stroke={gloveBorder}
              strokeWidth="1.5"
              transform={diveDir < 0 ? "rotate(-15 0 28)" : "rotate(10 28 38)"}
            />
            <rect
              x={diveDir < 0 ? 90 : 112}
              y={diveDir < 0 ? 28 : 20}
              width="12"
              height="16"
              rx="4"
              fill={gloveColor}
              stroke={gloveBorder}
              strokeWidth="1.5"
              transform={diveDir > 0 ? "rotate(15 118 28)" : "rotate(-10 96 34)"}
            />
          </>
        ) : isCelebrate ? (
          <>
            <path d="M38 48 Q24 26, 10 8" stroke="url(#skinGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M82 48 Q96 26, 110 8" stroke="url(#skinGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
            <rect x="2" y="0" width="14" height="18" rx="5" fill={gloveColor} stroke={gloveBorder} strokeWidth="1.5" />
            <rect x="104" y="0" width="14" height="18" rx="5" fill={gloveColor} stroke={gloveBorder} strokeWidth="1.5" />
          </>
        ) : (
          <>
            <path d="M38 48 Q22 44, 8 42" stroke="url(#skinGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M82 48 Q98 44, 112 42" stroke="url(#skinGrad)" strokeWidth="10" strokeLinecap="round" fill="none" />
            <rect x="0" y="34" width="14" height="18" rx="5" fill={gloveColor} stroke={gloveBorder} strokeWidth="1.5" />
            <rect x="106" y="34" width="14" height="18" rx="5" fill={gloveColor} stroke={gloveBorder} strokeWidth="1.5" />
          </>
        )}

        <path
          d="M40 92 L40 104 Q40 106, 42 106 L78 106 Q80 106, 80 104 L80 92Z"
          fill={shortsColor}
          stroke="#222"
          strokeWidth="0.5"
        />
        <line x1="60" y1="92" x2="60" y2="106" stroke="#333" strokeWidth="0.8" />

        <path d="M60 106 L60 96" stroke="#333" strokeWidth="0.5" />

        {isDiving ? (
          <>
            <path
              d={diveDir < 0
                ? "M44 106 Q36 130, 28 156"
                : "M44 106 Q40 130, 38 156"
              }
              stroke={shortsColor}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={diveDir < 0
                ? "M76 106 Q80 130, 82 156"
                : "M76 106 Q84 130, 92 156"
              }
              stroke={shortsColor}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d={diveDir < 0
                ? "M44 106 Q36 130, 28 156"
                : "M44 106 Q40 130, 38 156"
              }
              stroke={sockColor}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="0 80 40"
            />
            <path
              d={diveDir < 0
                ? "M76 106 Q80 130, 82 156"
                : "M76 106 Q84 130, 92 156"
              }
              stroke={sockColor}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              strokeDasharray="0 80 40"
            />

            <ellipse
              cx={diveDir < 0 ? 26 : 36}
              cy="162"
              rx="10"
              ry="5"
              fill={bootColor}
              stroke="#333"
              strokeWidth="0.5"
            />
            <ellipse
              cx={diveDir < 0 ? 84 : 94}
              cy="162"
              rx="10"
              ry="5"
              fill={bootColor}
              stroke="#333"
              strokeWidth="0.5"
            />
          </>
        ) : (
          <>
            <path d="M46 106 L40 150" stroke={shortsColor} strokeWidth="12" strokeLinecap="round" />
            <path d="M74 106 L80 150" stroke={shortsColor} strokeWidth="12" strokeLinecap="round" />

            <path d="M40 136 L40 154" stroke={sockColor} strokeWidth="12" strokeLinecap="round" />
            <path d="M80 136 L80 154" stroke={sockColor} strokeWidth="12" strokeLinecap="round" />

            <line x1="40" y1="140" x2="40" y2="142" stroke="white" strokeWidth="12" opacity="0.3" strokeLinecap="round" />
            <line x1="80" y1="140" x2="80" y2="142" stroke="white" strokeWidth="12" opacity="0.3" strokeLinecap="round" />

            <path d="M30 152 L40 155 L50 152 L50 160 Q40 164, 30 160Z" fill={bootColor} stroke="#333" strokeWidth="0.5" />
            <path d="M70 152 L80 155 L90 152 L90 160 Q80 164, 70 160Z" fill={bootColor} stroke="#333" strokeWidth="0.5" />
            <line x1="34" y1="156" x2="46" y2="156" stroke="#333" strokeWidth="0.5" />
            <line x1="74" y1="156" x2="86" y2="156" stroke="#333" strokeWidth="0.5" />
          </>
        )}

        {state === "diving-left" && (
          <circle cx="0" cy="26" r="8" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        )}
        {state === "diving-right" && (
          <circle cx="120" cy="26" r="8" fill="none" stroke="white" strokeWidth="1" opacity="0.3" />
        )}
      </svg>

      {isIdle && (
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black/30 blur-sm"
          style={{ width: 60 * scale, height: 6 * scale }}
          animate={{ scaleX: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {isCelebrate && (
        <motion.div
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-2xl">💪</span>
        </motion.div>
      )}
    </motion.div>
  );
}

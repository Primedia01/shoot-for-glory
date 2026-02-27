import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

type GoalieState = "idle" | "ready" | "diving-left" | "diving-right" | "celebrate";

interface GoalieProps {
  state: GoalieState;
  scale?: number;
}

export default function Goalie({ state, scale = 1 }: GoalieProps) {
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
          x: -180 * scale,
          y: -30 * scale,
          rotate: -35,
          transition: { duration: 0.35, ease: "easeOut" },
        });
        break;
      case "diving-right":
        bodyControls.start({
          x: 180 * scale,
          y: -30 * scale,
          rotate: 35,
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

  return (
    <motion.div
      className="relative"
      animate={bodyControls}
      style={{ width: 80 * scale, height: 120 * scale }}
    >
      <svg
        viewBox="0 0 80 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
      >
        <circle cx="40" cy="16" r="12" fill="#FFD699" stroke="#333" strokeWidth="1.5" />

        <rect x="14" y="14" width="52" height="6" rx="3" fill="#333" />
        <rect x="22" y="10" width="36" height="6" rx="3" fill="#333" />

        <rect x="26" y="28" width="28" height="36" rx="4" fill="#00cc52" stroke="#009940" strokeWidth="1" />

        <text x="40" y="52" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" fontFamily="sans-serif">1</text>

        {(state === "diving-left" || state === "diving-right") ? (
          <>
            <line x1="26" y1="38" x2={state === "diving-left" ? "-10" : "10"} y2="20" stroke="#FFD699" strokeWidth="6" strokeLinecap="round" />
            <line x1="54" y1="38" x2={state === "diving-left" ? "60" : "90"} y2="20" stroke="#FFD699" strokeWidth="6" strokeLinecap="round" />

            {state === "diving-left" ? (
              <>
                <rect x="-18" y="12" width="14" height="18" rx="3" fill="#FFD040" stroke="#cc9900" strokeWidth="1" />
              </>
            ) : (
              <>
                <rect x="84" y="12" width="14" height="18" rx="3" fill="#FFD040" stroke="#cc9900" strokeWidth="1" />
              </>
            )}
          </>
        ) : isCelebrate ? (
          <>
            <line x1="26" y1="36" x2="4" y2="8" stroke="#FFD699" strokeWidth="6" strokeLinecap="round" />
            <line x1="54" y1="36" x2="76" y2="8" stroke="#FFD699" strokeWidth="6" strokeLinecap="round" />
            <rect x="-2" y="0" width="12" height="14" rx="3" fill="#FFD040" stroke="#cc9900" strokeWidth="1" />
            <rect x="70" y="0" width="12" height="14" rx="3" fill="#FFD040" stroke="#cc9900" strokeWidth="1" />
          </>
        ) : (
          <>
            <line x1="26" y1="38" x2="6" y2="32" stroke="#FFD699" strokeWidth="6" strokeLinecap="round" />
            <line x1="54" y1="38" x2="74" y2="32" stroke="#FFD699" strokeWidth="6" strokeLinecap="round" />
            <rect x="0" y="26" width="12" height="14" rx="3" fill="#FFD040" stroke="#cc9900" strokeWidth="1" />
            <rect x="68" y="26" width="12" height="14" rx="3" fill="#FFD040" stroke="#cc9900" strokeWidth="1" />
          </>
        )}

        <line x1="32" y1="64" x2="24" y2="100" stroke="#333" strokeWidth="6" strokeLinecap="round" />
        <line x1="48" y1="64" x2="56" y2="100" stroke="#333" strokeWidth="6" strokeLinecap="round" />

        <rect x="16" y="98" width="16" height="8" rx="2" fill="#222" />
        <rect x="48" y="98" width="16" height="8" rx="2" fill="#222" />
      </svg>

      {isIdle && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/30 rounded-full blur-sm"
          animate={{ scaleX: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

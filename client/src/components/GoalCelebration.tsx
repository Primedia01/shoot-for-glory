import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotation: number;
  xDrift: number;
}

const COLORS = [
  "#00ff66", "#00cc52", "#ffffff", "#FFD700",
  "#00ff88", "#66ffaa", "#ffff00", "#00ffcc",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.5 + Math.random() * 1.5,
    size: 6 + Math.random() * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 720 - 360,
    xDrift: (Math.random() - 0.5) * 200,
  }));
}

interface GoalCelebrationProps {
  show: boolean;
  compact?: boolean;
}

export default function GoalCelebration({ show, compact = false }: GoalCelebrationProps) {
  const particles = useMemo(() => generateParticles(compact ? 30 : 60), [compact]);

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="absolute inset-0 z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: "-5%",
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                }}
                initial={{ y: 0, x: 0, opacity: 1, rotate: 0 }}
                animate={{
                  y: compact ? "110vh" : "110vh",
                  x: p.xDrift,
                  opacity: [1, 1, 0.8, 0],
                  rotate: p.rotation,
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: "easeIn",
                }}
              />
            ))}
          </motion.div>

          <motion.div
            className="absolute inset-0 z-35 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              background: "radial-gradient(circle at center, rgba(0,255,102,0.3) 0%, transparent 70%)",
            }}
          />

          {!compact && (
            <>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={`ring-${i}`}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40 z-35 pointer-events-none"
                  initial={{ width: 0, height: 0, opacity: 0.8 }}
                  animate={{
                    width: [0, 600 + i * 200],
                    height: [0, 600 + i * 200],
                    opacity: [0.8, 0],
                  }}
                  transition={{
                    duration: 1.2,
                    delay: i * 0.2,
                    ease: "easeOut",
                  }}
                />
              ))}
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

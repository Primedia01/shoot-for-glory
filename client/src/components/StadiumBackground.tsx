import { useMemo } from "react";

const CROWD_COLORS = [
  "#5B4A8A", "#7B5EA7", "#4A3D6E", "#6B5B95", "#8B7CB8",
  "#3D3566", "#9B8EC4", "#2D2550", "#6A5D8E", "#4B3F73",
  "#7A6BA5", "#5C4F82", "#8C7DB5", "#3E3768", "#9A8BBE",
  "#2E2852", "#6C5F90", "#4D4175", "#7C6DA7", "#5E5184",
  "#1B998B", "#2AA89A", "#168F81", "#23B0A2", "#0F7E72",
  "#56042C", "#6B1040", "#451035", "#7A1A4A", "#350828",
];

function generateCrowdRow(y: number, blockH: number, count: number, seed: number): JSX.Element[] {
  const blocks: JSX.Element[] = [];
  const w = 100 / count;
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 7 + y * 13) % CROWD_COLORS.length;
    const opacity = 0.5 + ((seed + i * 3) % 5) * 0.1;
    blocks.push(
      <rect
        key={`${y}-${i}`}
        x={`${i * w}%`}
        y={y}
        width={`${w + 0.2}%`}
        height={blockH + 0.5}
        fill={CROWD_COLORS[idx]}
        opacity={opacity}
      />
    );
  }
  return blocks;
}

export default function StadiumBackground() {
  const crowdBlocks = useMemo(() => {
    const rows: JSX.Element[] = [];
    const blockH = 18;
    const cols = 50;
    for (let row = 0; row < 10; row++) {
      rows.push(...generateCrowdRow(row * blockH, blockH, cols, row * 17 + 3));
    }
    return rows;
  }, []);

  return (
    <svg
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2D8C4E" />
          <stop offset="100%" stopColor="#1E6B38" />
        </linearGradient>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0e30" />
          <stop offset="100%" stopColor="#2D2050" />
        </linearGradient>
        <linearGradient id="standLeft" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C45B3F" />
          <stop offset="100%" stopColor="#D47058" />
        </linearGradient>
        <linearGradient id="standRight" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8DBCB0" />
          <stop offset="100%" stopColor="#A3CEC2" />
        </linearGradient>
        <linearGradient id="netFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
      </defs>

      <rect width="1920" height="180" fill="url(#skyGrad)" />

      <g transform="translate(0, 0)">
        {crowdBlocks}
      </g>

      <rect x="0" y="180" width="560" height="350" fill="url(#standLeft)" opacity="0.85" />
      <rect x="1360" y="180" width="560" height="350" fill="url(#standRight)" opacity="0.85" />

      <rect x="560" y="180" width="800" height="350" fill="#3D3566" opacity="0.4" />

      <rect x="0" y="480" width="1920" height="600" fill="url(#pitchGrad)" />

      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={`stripe-${i}`}
          x="0"
          y={480 + i * 50}
          width="1920"
          height="50"
          fill={i % 2 === 0 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}
        />
      ))}

      <line x1="0" y1="520" x2="1920" y2="520" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

      <rect x="760" y="490" width="400" height="2" fill="rgba(255,255,255,0.15)" />
      <rect x="760" y="490" width="2" height="60" fill="rgba(255,255,255,0.15)" />
      <rect x="1158" y="490" width="2" height="60" fill="rgba(255,255,255,0.15)" />

      <circle cx="960" cy="490" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />

      <rect x="560" y="530" width="800" height="6" fill="white" opacity="0.8" rx="1" />
      <rect x="560" y="530" width="6" height="420" fill="white" opacity="0.8" rx="1" />
      <rect x="1354" y="530" width="6" height="420" fill="white" opacity="0.8" rx="1" />

      <rect x="565" y="535" width="790" height="415" fill="url(#netFade)" />
      {Array.from({ length: 30 }).map((_, i) => (
        <line
          key={`vnet-${i}`}
          x1={565 + i * 26.5}
          y1="535"
          x2={565 + i * 26.5}
          y2="950"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: 16 }).map((_, i) => (
        <line
          key={`hnet-${i}`}
          x1="565"
          y1={535 + i * 26}
          x2="1355"
          y2={535 + i * 26}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
      ))}

      <line x1="565" y1="530" x2="680" y2="400" stroke="white" strokeWidth="3" opacity="0.5" />
      <line x1="1355" y1="530" x2="1240" y2="400" stroke="white" strokeWidth="3" opacity="0.5" />
      <line x1="680" y1="400" x2="1240" y2="400" stroke="white" strokeWidth="3" opacity="0.5" />

      {Array.from({ length: 22 }).map((_, i) => {
        const x1 = 680 + i * 25.5;
        const x2Ratio = (x1 - 565) / (1355 - 565);
        const x2 = 565 + x2Ratio * 790;
        return (
          <line
            key={`dnet-v-${i}`}
            x1={x1}
            y1="400"
            x2={x2}
            y2="530"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}
      {Array.from({ length: 5 }).map((_, i) => {
        const y = 400 + i * 26;
        const ratio = i / 5;
        const lx = 680 - ratio * (680 - 565);
        const rx = 1240 + ratio * (1355 - 1240);
        return (
          <line
            key={`dnet-h-${i}`}
            x1={lx}
            y1={y}
            x2={rx}
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {[0.1, 0.3, 0.5, 0.7, 0.9].map((pos, i) => (
        <circle
          key={`light-${i}`}
          cx={1920 * pos}
          cy="30"
          r="80"
          fill="white"
          opacity="0.04"
        />
      ))}
    </svg>
  );
}

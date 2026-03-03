import { useMemo } from "react";

const CROWD_COLORS = [
  "#5B4A8A", "#7B5EA7", "#4A3D6E", "#6B5B95", "#8B7CB8",
  "#3D3566", "#9B8EC4", "#2D2550", "#6A5D8E", "#4B3F73",
  "#7A6BA5", "#5C4F82", "#8C7DB5", "#3E3768", "#9A8BBE",
  "#2E2852", "#6C5F90", "#4D4175", "#7C6DA7", "#5E5184",
  "#1B998B", "#2AA89A", "#168F81", "#23B0A2", "#0F7E72",
  "#443366", "#554488", "#332255", "#665599", "#553377",
];

function generateCrowdBlocks(startY: number, rows: number, blockH: number, cols: number, seed: number): JSX.Element[] {
  const blocks: JSX.Element[] = [];
  const w = 1920 / cols;
  for (let row = 0; row < rows; row++) {
    for (let i = 0; i < cols; i++) {
      const idx = (seed + i * 7 + row * 13 + (i * row) * 3) % CROWD_COLORS.length;
      const opacity = 0.6 + ((seed + i * 3 + row * 5) % 4) * 0.1;
      blocks.push(
        <rect
          key={`c-${row}-${i}`}
          x={i * w}
          y={startY + row * blockH}
          width={w + 0.5}
          height={blockH + 0.5}
          fill={CROWD_COLORS[idx]}
          opacity={opacity}
        />
      );
    }
  }
  return blocks;
}

export default function StadiumBackground() {
  const crowdBlocks = useMemo(() => generateCrowdBlocks(0, 12, 30, 60, 7), []);

  const goalX = 460;
  const goalW = 1000;
  const goalTopY = 420;
  const goalBottomY = 870;
  const goalH = goalBottomY - goalTopY;
  const postW = 10;
  const crossbarH = 10;

  const netCols = 35;
  const netRows = 16;
  const netCellW = goalW / netCols;
  const netCellH = goalH / netRows;

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
      </defs>

      <rect width="1920" height="360" fill="url(#skyGrad)" />

      <g>{crowdBlocks}</g>

      <rect x="0" y="360" width="460" height="200" fill="#C45B3F" opacity="0.75" />
      <rect x="1460" y="360" width="460" height="200" fill="#8DBCB0" opacity="0.75" />
      <rect x="460" y="360" width="1000" height="200" fill="#4A3D6E" opacity="0.3" />

      <rect x="0" y="530" width="1920" height="550" fill="url(#pitchGrad)" />

      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={`stripe-${i}`}
          x="0"
          y={530 + i * 55}
          width="1920"
          height="55"
          fill={i % 2 === 0 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"}
        />
      ))}

      <line x1="0" y1="555" x2="1920" y2="555" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

      <rect x="760" y="535" width="400" height="1.5" fill="rgba(255,255,255,0.12)" />
      <rect x="760" y="535" width="1.5" height="50" fill="rgba(255,255,255,0.12)" />
      <rect x="1159" y="535" width="1.5" height="50" fill="rgba(255,255,255,0.12)" />

      <rect x={goalX} y={goalTopY} width={goalW} height={goalH} fill="rgba(60,40,80,0.35)" rx="2" />

      {Array.from({ length: netCols + 1 }).map((_, i) => (
        <line
          key={`vn-${i}`}
          x1={goalX + i * netCellW}
          y1={goalTopY}
          x2={goalX + i * netCellW}
          y2={goalBottomY}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: netRows + 1 }).map((_, i) => (
        <line
          key={`hn-${i}`}
          x1={goalX}
          y1={goalTopY + i * netCellH}
          x2={goalX + goalW}
          y2={goalTopY + i * netCellH}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1"
        />
      ))}

      <rect x={goalX - postW / 2} y={goalTopY - crossbarH / 2} width={goalW + postW} height={crossbarH} fill="white" rx="4" />
      <rect x={goalX - postW / 2} y={goalTopY} width={postW} height={goalH} fill="white" rx="3" />
      <rect x={goalX + goalW - postW / 2} y={goalTopY} width={postW} height={goalH} fill="white" rx="3" />

      <rect x={goalX - postW / 2} y={goalTopY - crossbarH / 2} width={goalW + postW} height={crossbarH} fill="rgba(255,255,255,0.3)" rx="4" />

      <rect x={goalX + 2} y={goalTopY + 2} width={postW - 4} height={goalH - 4} fill="rgba(200,200,200,0.1)" />
      <rect x={goalX + goalW - postW + 2} y={goalTopY + 2} width={postW - 4} height={goalH - 4} fill="rgba(200,200,200,0.1)" />

      {[0.15, 0.35, 0.5, 0.65, 0.85].map((pos, i) => (
        <ellipse
          key={`light-${i}`}
          cx={1920 * pos}
          cy="50"
          rx="100"
          ry="60"
          fill="white"
          opacity="0.03"
        />
      ))}
    </svg>
  );
}

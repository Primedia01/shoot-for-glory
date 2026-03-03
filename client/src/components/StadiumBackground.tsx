import { useMemo } from "react";

const CROWD_COLORS = [
  "#5B4A8A", "#7B5EA7", "#4A3D6E", "#6B5B95", "#8B7CB8",
  "#3D3566", "#9B8EC4", "#2D2550", "#6A5D8E", "#4B3F73",
  "#7A6BA5", "#5C4F82", "#8C7DB5", "#3E3768", "#9A8BBE",
  "#2E2852", "#6C5F90", "#4D4175", "#7C6DA7", "#5E5184",
  "#1B998B", "#2AA89A", "#168F81", "#23B0A2", "#0F7E72",
  "#443366", "#554488", "#332255", "#665599", "#553377",
];

interface SponsorPanel {
  text: string;
  bgColor: string;
  textColor?: string;
}

interface StadiumBackgroundProps {
  leftPanel?: SponsorPanel;
  rightPanel?: SponsorPanel;
  adBoardSponsors?: string[];
}

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

export default function StadiumBackground({
  leftPanel = { text: "SPONSOR 1", bgColor: "#C45B3F" },
  rightPanel = { text: "SPONSOR 2", bgColor: "#8DBCB0" },
  adBoardSponsors = ["COCA-COLA", "ADIDAS", "VISA", "HYUNDAI", "QATAR AIRWAYS", "HISENSE", "VIVO"],
}: StadiumBackgroundProps) {
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

  const panelY = 360;
  const panelH = 200;
  const leftPanelW = 460;
  const rightPanelX = 1460;
  const rightPanelW = 460;

  const adBoardY = panelY;
  const adBoardH = 50;
  const adBoardFullW = 1920;

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

      <rect x="0" y={panelY} width={leftPanelW} height={panelH} fill={leftPanel.bgColor} opacity="0.85" />
      <rect x={rightPanelX} y={panelY} width={rightPanelW} height={panelH} fill={rightPanel.bgColor} opacity="0.85" />

      <rect x="0" y={panelY} width={leftPanelW} height={panelH} fill="rgba(0,0,0,0.15)" />
      <rect x={rightPanelX} y={panelY} width={rightPanelW} height={panelH} fill="rgba(0,0,0,0.15)" />

      <text
        x={leftPanelW / 2}
        y={panelY + panelH / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={leftPanel.textColor || "white"}
        fontSize="48"
        fontFamily="'Bebas Neue', sans-serif"
        letterSpacing="0.15em"
        opacity="0.9"
      >
        {leftPanel.text}
      </text>

      <text
        x={rightPanelX + rightPanelW / 2}
        y={panelY + panelH / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={rightPanel.textColor || "white"}
        fontSize="48"
        fontFamily="'Bebas Neue', sans-serif"
        letterSpacing="0.15em"
        opacity="0.9"
      >
        {rightPanel.text}
      </text>

      <rect x={goalX} y={panelY} width={goalW} height={panelH} fill="#4A3D6E" opacity="0.3" />

      <rect x="0" y={adBoardY + panelH} width={adBoardFullW} height={adBoardH} fill="#1a1a2e" />
      <rect x="0" y={adBoardY + panelH} width={adBoardFullW} height="2" fill="rgba(212,168,67,0.4)" />
      <rect x="0" y={adBoardY + panelH + adBoardH - 2} width={adBoardFullW} height="2" fill="rgba(212,168,67,0.3)" />

      {adBoardSponsors.map((sponsor, i) => {
        const sectionW = adBoardFullW / adBoardSponsors.length;
        const cx = i * sectionW + sectionW / 2;
        return (
          <g key={`ad-${i}`}>
            {i > 0 && (
              <line
                x1={i * sectionW}
                y1={adBoardY + panelH + 6}
                x2={i * sectionW}
                y2={adBoardY + panelH + adBoardH - 6}
                stroke="rgba(212,168,67,0.2)"
                strokeWidth="1"
              />
            )}
            <text
              x={cx}
              y={adBoardY + panelH + adBoardH / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#D4A843"
              fontSize="22"
              fontFamily="'Bebas Neue', sans-serif"
              letterSpacing="0.2em"
              opacity="0.8"
            >
              {sponsor}
            </text>
          </g>
        );
      })}

      <rect x="0" y={adBoardY + panelH + adBoardH} width="1920" height="550" fill="url(#pitchGrad)" />

      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={`stripe-${i}`}
          x="0"
          y={adBoardY + panelH + adBoardH + i * 55}
          width="1920"
          height="55"
          fill={i % 2 === 0 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"}
        />
      ))}

      <line x1="0" y1={adBoardY + panelH + adBoardH + 25} x2="1920" y2={adBoardY + panelH + adBoardH + 25} stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

      <rect x="760" y={adBoardY + panelH + adBoardH + 5} width="400" height="1.5" fill="rgba(255,255,255,0.12)" />
      <rect x="760" y={adBoardY + panelH + adBoardH + 5} width="1.5" height="50" fill="rgba(255,255,255,0.12)" />
      <rect x="1159" y={adBoardY + panelH + adBoardH + 5} width="1.5" height="50" fill="rgba(255,255,255,0.12)" />

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

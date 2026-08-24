// A huge receding colonnade behind the login form - like walking into an
// ancient Greek temple. Columns get smaller/closer together toward a
// glowing vanishing point, framed by a receding entablature and a distant
// pediment, with perspective floor/step lines leading in.
const GOLD = "#c9a227";
const GOLD_LIGHT = "#e8d9a0";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// t=0 is nearest to the viewer (biggest), t=1 is deep in the temple (tiny,
// near the vanishing point). Non-linear spacing - more spread out up
// close, tightly clustered far away - is what actually reads as perspective.
const DEPTHS = [0, 0.42, 0.7, 0.89];
const VANISH_X = 800;
const VANISH_Y = 260;

function columnConfig(side) {
  const nearX = side === "left" ? 40 : 1560;
  const farX = side === "left" ? 745 : 855;
  return DEPTHS.map((t) => ({
    x: lerp(nearX, farX, t),
    yBase: lerp(880, 330, t),
    height: lerp(700, 42, t),
    width: lerp(96, 10, t),
    opacity: lerp(0.85, 0.22, t),
  }));
}

function Column({ x, yBase, height, width, opacity }) {
  const capH = width * 0.32;
  const baseH = width * 0.28;
  const capW = width * 1.45;
  const baseW = width * 1.3;
  const shaftTop = yBase - height;
  const shaftBottom = yBase - baseH;
  const strokeW = Math.max(0.75, width * 0.035);
  const fluteCount = width > 40 ? 6 : width > 18 ? 4 : 0;

  return (
    <g opacity={opacity}>
      <rect
        x={x - baseW / 2}
        y={yBase - baseH}
        width={baseW}
        height={baseH}
        fill="rgba(201,162,39,0.08)"
        stroke={GOLD}
        strokeWidth={strokeW}
      />
      <rect
        x={x - width / 2}
        y={shaftTop}
        width={width}
        height={shaftBottom - shaftTop}
        fill="rgba(201,162,39,0.05)"
        stroke={GOLD}
        strokeWidth={strokeW}
      />
      {Array.from({ length: fluteCount }).map((_, i) => {
        const fx = x - width / 2 + ((i + 1) * width) / (fluteCount + 1);
        return (
          <line
            key={i}
            x1={fx}
            y1={shaftTop + 2}
            x2={fx}
            y2={shaftBottom - 2}
            stroke={GOLD}
            strokeWidth={strokeW * 0.6}
            opacity={0.6}
          />
        );
      })}
      <rect
        x={x - capW / 2}
        y={shaftTop - capH}
        width={capW}
        height={capH}
        fill="rgba(201,162,39,0.08)"
        stroke={GOLD}
        strokeWidth={strokeW}
      />
    </g>
  );
}

export default function TempleBackdrop() {
  const leftCols = columnConfig("left");
  const rightCols = columnConfig("right");
  const nearLeft = leftCols[0];
  const nearRight = rightCols[0];
  const farLeft = leftCols[leftCols.length - 1];
  const farRight = rightCols[rightCols.length - 1];

  const nearRoofY = nearLeft.yBase - nearLeft.height - nearLeft.width * 0.32 - 10;
  const farRoofY = VANISH_Y + 34;

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="login-glow"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: 0.5,
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <defs>
        <radialGradient id="templeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={GOLD_LIGHT} stopOpacity="0.9" />
          <stop offset="45%" stopColor={GOLD} stopOpacity="0.35" />
          <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Distant glow through the far doorway */}
      <ellipse cx={VANISH_X} cy={VANISH_Y + 40} rx="230" ry="180" fill="url(#templeGlow)" />

      {/* Distant pediment glimpsed at the end of the colonnade */}
      <path
        d={`M ${VANISH_X - 95} ${farRoofY} L ${VANISH_X} ${farRoofY - 55} L ${VANISH_X + 95} ${farRoofY} Z`}
        fill="rgba(201,162,39,0.1)"
        stroke={GOLD}
        strokeWidth="1.5"
        opacity="0.55"
      />
      <line
        x1={VANISH_X - 95} y1={farRoofY} x2={VANISH_X + 95} y2={farRoofY}
        stroke={GOLD} strokeWidth="1.5" opacity="0.55"
      />

      {/* Receding entablature connecting the near column tops to the far facade */}
      <path
        d={`M ${nearLeft.x - nearLeft.width * 0.73} ${nearRoofY}
            L ${VANISH_X - 95} ${farRoofY}
            L ${VANISH_X + 95} ${farRoofY}
            L ${nearRight.x + nearRight.width * 0.73} ${nearRoofY} Z`}
        fill="rgba(201,162,39,0.06)"
        stroke={GOLD}
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Floor: perspective lines converging toward the vanishing point */}
      {[0, 260, 520, 780, 1600 - 780, 1600 - 520, 1600 - 260, 1600].map((fx) => (
        <line
          key={fx}
          x1={fx} y1="900" x2={VANISH_X} y2={VANISH_Y + 60}
          stroke={GOLD_LIGHT} strokeWidth="1" opacity="0.16"
        />
      ))}
      {/* Steps leading up into the temple */}
      {[860, 800, 740].map((y, i) => (
        <line
          key={y}
          x1={lerp(0, VANISH_X, i * 0.12)} y1={y}
          x2={lerp(1600, VANISH_X, i * 0.12)} y2={y}
          stroke={GOLD_LIGHT} strokeWidth="1.5" opacity={0.22 - i * 0.05}
        />
      ))}

      {leftCols.map((c, i) => <Column key={`l${i}`} {...c} />)}
      {rightCols.map((c, i) => <Column key={`r${i}`} {...c} />)}
    </svg>
  );
}

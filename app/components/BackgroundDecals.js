// Ambient corner ornaments behind every page - crossed spears with a
// crest at their center and a soft gold glow, echoing the login page's
// Upper Echelon iconography without competing with page content.
function Spear({ style, flip = false }) {
  return (
    <svg
      viewBox="0 0 240 240"
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 0,
        transform: flip ? "scaleX(-1)" : undefined,
        ...style,
      }}
    >
      <defs>
        <radialGradient id={`decalGlow-${flip}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c9a227" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#c9a227" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="120" cy="120" r="120" fill={`url(#decalGlow-${flip})`} />
      {[45, -45].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 120 120)`} opacity="0.8">
          <line x1="120" y1="4" x2="120" y2="236" stroke="#e8d9a0" strokeWidth="1.5" />
          <path d="M120 0 L138 40 L120 30 L102 40 Z" fill="#e8d9a0" />
          <line x1="98" y1="46" x2="142" y2="46" stroke="#e8d9a0" strokeWidth="1.5" />
        </g>
      ))}
      <g opacity="0.9">
        <path
          d="M120 96 150 112V148c0 24-16 38-30 46-14-8-30-22-30-46v-36l30-16Z"
          fill="none"
          stroke="#c9a227"
          strokeWidth="2"
        />
        <path d="M120 116 138 126v14c0 12-8 20-18 26-10-6-18-14-18-26v-14l18-10Z" fill="#c9a227" fillOpacity="0.5" />
      </g>
    </svg>
  );
}

export default function BackgroundDecals() {
  return (
    <>
      <Spear style={{ top: -160, right: -160, width: 620, height: 620, opacity: 0.11 }} />
      <Spear style={{ bottom: -180, left: -180, width: 680, height: 680, opacity: 0.11 }} flip />
    </>
  );
}

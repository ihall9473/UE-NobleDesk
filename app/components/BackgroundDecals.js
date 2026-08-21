export default function BackgroundDecals() {
  const Spear = ({ style }) => (
    <svg viewBox="0 0 240 240" style={{ position: "fixed", opacity: 0.05, pointerEvents: "none", zIndex: 0, ...style }}>
      {[45, -45].map((angle) => (
        <g key={angle} transform={`rotate(${angle} 120 120)`}>
          <line x1="120" y1="4" x2="120" y2="236" stroke="#e8d9a0" strokeWidth="1.5" />
          <path d="M120 0 L136 36 L120 27 L104 36 Z" fill="#e8d9a0" />
          <line x1="102" y1="42" x2="138" y2="42" stroke="#e8d9a0" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  );

  return (
    <>
      <Spear style={{ top: -80, right: -100, width: 420, height: 420 }} />
      <Spear style={{ bottom: -120, left: -140, width: 480, height: 480 }} />
    </>
  );
}

// The Upper Echelon shield emblem, reused in the nav bar, login page, and
// the welcome/cover page. Pass glow to apply the pulsing gold glow used on
// the bigger, more prominent versions.
export default function Crest({ size = 26, glow = false, className = "" }) {
  return (
    <svg
      className={[glow ? "login-crest" : "", className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 1.5 21 5.5V11c0 6-4 9.5-9 11.5C7 20.5 3 17 3 11V5.5L12 1.5Z"
        stroke="#c9a227"
        strokeWidth="1.2"
      />
      <path d="M12 6 16 8v3.2c0 3-1.7 5-4 6.3-2.3-1.3-4-3.3-4-6.3V8L12 6Z" fill="#c9a227" fillOpacity="0.9" />
    </svg>
  );
}

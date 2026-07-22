export function WaveDivider({ color, className = "" }) {
  return (
    <svg
      viewBox="0 0 1440 60"
      preserveAspectRatio="none"
      className={`absolute left-0 top-0 h-8 w-full sm:h-12 ${className}`}
      aria-hidden="true"
    >
      <path fill={color} d="M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,0 L0,0 Z" />
    </svg>
  );
}

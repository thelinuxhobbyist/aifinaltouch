export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg className="logo__mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M9.2 16.4l4.1 4.1L22.8 11.2"
        fill="none"
        stroke="#fff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      AI Final Touch
    </span>
  );
}

export function LogoMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="var(--c-night)" />
      <path d="M15 1h2a6 6 0 0 1 6 6v2h-8z" fill="var(--c-brand)" />
      <path d="M6.5 12.5l3.2 3.2L17 8.5" fill="none" stroke="var(--c-on-night)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span>
        AI Final <span className="logo__light">Touch</span>
      </span>
    </span>
  );
}

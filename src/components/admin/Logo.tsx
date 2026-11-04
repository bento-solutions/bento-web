export const Logo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--theme-text)' }}>
    <Icon />
    <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em' }}>Le carnet Bento</span>
  </div>
)

export const Icon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ color: '#2B46B5' }}>
    <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="4.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 3v18M11 12h10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

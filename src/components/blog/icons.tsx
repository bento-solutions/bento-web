type IconProps = { size?: number; className?: string }

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className,
})

export const LogoMark = ({ size = 24, className }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
    <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="4.25" stroke="currentColor" strokeWidth="1.5" />
    <path d="M11 3v18M11 12h10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

export const ArrowIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, `icon-arrow ${className ?? ''}`)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const PlusIcon = ({ size = 24, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const SunIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const MoonIcon = ({ size = 18, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
  </svg>
)

export const LinkIcon = ({ size = 16, className }: IconProps) => (
  <svg {...base(size, className)}>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </svg>
)

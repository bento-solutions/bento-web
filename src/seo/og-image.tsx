import { readFile } from 'fs/promises'
import { ImageResponse } from 'next/og'
import path from 'path'

import type { Locale } from '@/domain/types'

export const ogSize = { width: 1200, height: 630 }

const font = (file: string) => readFile(path.join(process.cwd(), 'src/assets/og', file))

const loadFonts = async () => {
  const [sans, sansExt, mono, arabic] = await Promise.all([
    font('instrument-sans-latin-500-normal.woff'),
    font('instrument-sans-latin-ext-500-normal.woff'),
    font('geist-mono-latin-400-normal.woff'),
    font('cairo-arabic-500-normal.woff'),
  ])
  return [
    { name: 'Instrument Sans', data: sans, weight: 500 as const, style: 'normal' as const },
    { name: 'Instrument Sans', data: sansExt, weight: 500 as const, style: 'normal' as const },
    { name: 'Geist Mono', data: mono, weight: 400 as const, style: 'normal' as const },
    { name: 'Cairo', data: arabic, weight: 500 as const, style: 'normal' as const },
  ]
}

/**
 * The image renderer shapes Arabic letters but has no bidirectional layout, so it would lay the
 * words out left to right. Each word becomes its own box in a reversed row, which restores the order.
 */
const Words = ({ text, rtl, gap }: { text: string; rtl: boolean; gap: number }) =>
  rtl ? (
    <div style={{ display: 'flex', flexDirection: 'row-reverse', flexWrap: 'wrap', columnGap: gap }}>
      {text.split(/\s+/).map((word, index) => (
        <span key={index}>{word}</span>
      ))}
    </div>
  ) : (
    <div style={{ display: 'flex' }}>{text}</div>
  )

type OgProps = { title: string; meta: string; section: string; locale: Locale }

/** Every shared link gets a card in the blog's colours, with no design work per post. */
export const renderOgImage = async ({ title, meta, section, locale }: OgProps) => {
  const rtl = locale === 'ar'
  const titleSize = title.length > 70 ? 56 : title.length > 42 ? 66 : 78
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 64,
        background: '#F7F7F5',
        color: '#1C1B19',
        fontFamily: rtl ? 'Cairo' : 'Instrument Sans',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexDirection: rtl ? 'row-reverse' : 'row' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="4.25" stroke="#2B46B5" strokeWidth="1.5" />
          <path d="M11 3v18M11 12h10" stroke="#2B46B5" strokeWidth="1.5" />
        </svg>
        <div style={{ display: 'flex', fontSize: 30, letterSpacing: '-0.015em', fontFamily: 'Instrument Sans' }}>Bento</div>
        <div style={{ display: 'flex', width: 1, height: 26, background: '#D3D2CD', margin: '0 4px' }} />
        <div style={{ display: 'flex', fontSize: 26, color: '#55534E' }}>{section}</div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: rtl ? 'flex-end' : 'flex-start',
          fontSize: titleSize,
          lineHeight: rtl ? 1.3 : 1.06,
          letterSpacing: rtl ? 0 : '-0.035em',
          maxWidth: rtl ? 1072 : 1040,
        }}
      >
        <Words text={title} rtl={rtl} gap={titleSize * 0.26} />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: rtl ? 'flex-end' : 'flex-start',
          paddingTop: 20,
          borderTop: '1px solid #D3D2CD',
          fontFamily: rtl ? 'Cairo' : 'Geist Mono',
          fontSize: 22,
          color: '#6F6D67',
        }}
      >
        <Words text={meta} rtl={rtl} gap={6} />
      </div>
    </div>,
    { ...ogSize, fonts: await loadFonts() },
  )
}

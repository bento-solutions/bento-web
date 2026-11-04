'use client'

import { MoonIcon, SunIcon } from './icons'

const STORAGE_KEY = 'bento_blog_theme'

/** Runs before paint so a saved choice never flashes the wrong theme. Without one, the OS decides. */
export const themeScript = `try{var t=localStorage.getItem('${STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`

export const ThemeToggle = ({ label }: { label: string }) => {
  const toggle = () => {
    const root = document.documentElement
    const current =
      root.getAttribute('data-theme') ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    root.setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Private browsing can block storage. The theme still changes for this page.
    }
  }

  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      <SunIcon className="theme-icon theme-icon--sun" />
      <MoonIcon className="theme-icon theme-icon--moon" />
    </button>
  )
}

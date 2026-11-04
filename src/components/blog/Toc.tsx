'use client'

import { useEffect, useState } from 'react'

import type { Heading } from '@/lib/lexical'

/** Numbered like the rows of a ledger. Marks the section being read. */
export const Toc = ({ headings, title }: { headings: Heading[]; title: string }) => {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const targets = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null)
    if (!targets.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length) setActive(visible[visible.length - 1].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px' },
    )
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  const list = (
    <ol className="toc__list">
      {headings.map((heading) => (
        <li key={heading.id}>
          <a
            href={`#${heading.id}`}
            className={`toc__item ${active === heading.id ? 'is-active' : ''}`}
            aria-current={active === heading.id ? 'location' : undefined}
          >
            <span className="toc__number mono">{heading.number}</span>
            <span>{heading.text}</span>
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <>
      <nav className="toc toc--rail" aria-label={title}>
        <p className="toc__title">{title}</p>
        {list}
      </nav>
      <details className="toc toc--inline">
        <summary className="toc__title">{title}</summary>
        {list}
      </details>
    </>
  )
}

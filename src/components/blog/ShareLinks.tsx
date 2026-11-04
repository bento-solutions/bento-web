'use client'

import { useState } from 'react'

import { LinkIcon } from './icons'

type Props = {
  url: string
  title: string
  labels: { share: string; copy: string; copied: string }
}

export const ShareLinks = ({ url, title, labels }: Props) => {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt(labels.copy, url)
    }
  }

  const encoded = encodeURIComponent(url)
  return (
    <div className="share">
      <span className="share__label">{labels.share}</span>
      <a
        className="chip"
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
      <a
        className="chip"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        LinkedIn
      </a>
      <button type="button" className="chip" onClick={copy}>
        <LinkIcon size={14} /> <span aria-live="polite">{copied ? labels.copied : labels.copy}</span>
      </button>
    </div>
  )
}

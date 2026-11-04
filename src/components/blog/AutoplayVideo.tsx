'use client'

import { useEffect, useRef } from 'react'

type Props = {
  src: string
  mimeType: string
  label: string
  className?: string
}

const whenPageHasSettled = (callback: () => void): (() => void) => {
  let idleHandle: number | undefined
  const schedule = () => {
    idleHandle = window.requestIdleCallback
      ? window.requestIdleCallback(callback, { timeout: 2000 })
      : window.setTimeout(callback, 200)
  }
  if (document.readyState === 'complete') schedule()
  else window.addEventListener('load', schedule, { once: true })

  return () => {
    window.removeEventListener('load', schedule)
    if (idleHandle === undefined) return
    if (window.cancelIdleCallback) window.cancelIdleCallback(idleHandle)
    else window.clearTimeout(idleHandle)
  }
}

/**
 * Muted looping video, played on top of a still image. Nothing downloads until the page has settled
 * and the video is on screen, so covers never slow the first paint. Readers who asked for less
 * motion, or whose browser refuses autoplay, simply keep the still image.
 */
export const AutoplayVideo = ({ src, mimeType, label, className }: Props) => {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    if (!video) return
    video.muted = true
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined)
        else video.pause()
      },
      { threshold: 0.2 },
    )
    const cancel = whenPageHasSettled(() => observer.observe(video))
    return () => {
      cancel()
      observer.disconnect()
    }
  }, [])

  return (
    <video ref={ref} className={className} muted loop playsInline preload="none" aria-label={label}>
      <source src={src} type={mimeType} />
    </video>
  )
}

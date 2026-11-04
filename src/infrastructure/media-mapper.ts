import type { ImageAsset, MediaAsset } from '../domain/types'
import type { Media } from '../payload-types'

const publicUrl = (filename: string): string => `/media/${encodeURIComponent(filename)}`

export const mapImage = (media: Media | number | null | undefined): ImageAsset | null => {
  if (!media || typeof media === 'number' || !media.filename) return null
  if (!media.mimeType?.startsWith('image/')) return null

  const sizes = Object.values(media.sizes ?? {})
    .filter((size): size is { filename: string; width: number } => Boolean(size?.filename && size?.width))
    .sort((a, b) => a.width - b.width)
  const srcSet = sizes.map((size) => `${publicUrl(size.filename)} ${size.width}w`).join(', ')
  const large = media.sizes?.feature?.filename ?? media.filename

  return {
    kind: 'image',
    url: publicUrl(media.filename),
    largeUrl: publicUrl(large),
    alt: media.alt ?? '',
    width: media.width ?? 1600,
    height: media.height ?? 1000,
    srcSet,
    focal:
      typeof media.focalX === 'number' && typeof media.focalY === 'number'
        ? { x: media.focalX, y: media.focalY }
        : null,
  }
}

export const mapMedia = (media: Media | number | null | undefined): MediaAsset | null => {
  if (!media || typeof media === 'number' || !media.filename) return null
  if (media.mimeType?.startsWith('video/')) {
    return {
      kind: 'video',
      url: publicUrl(media.filename),
      mimeType: media.mimeType,
      alt: media.alt ?? '',
      poster: mapImage(media.poster),
    }
  }
  return mapImage(media)
}

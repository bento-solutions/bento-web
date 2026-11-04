import { preload } from 'react-dom'

import type { ImageAsset, MediaAsset } from '@/domain/types'

import { AutoplayVideo } from './AutoplayVideo'
import { PlusIcon } from './icons'

type PictureProps = {
  asset: ImageAsset
  sizes: string
  priority?: boolean
  className?: string
}

/** Payload has already generated the sizes at upload, so the VPS does no image work per request. */
export const Picture = ({ asset, sizes, priority, className }: PictureProps) => {
  if (priority) {
    preload(asset.largeUrl, {
      as: 'image',
      fetchPriority: 'high',
      imageSrcSet: asset.srcSet || undefined,
      imageSizes: sizes,
    })
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      src={asset.largeUrl}
      srcSet={asset.srcSet || undefined}
      sizes={sizes}
      alt={asset.alt}
      width={asset.width}
      height={asset.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      style={asset.focal ? { objectPosition: `${asset.focal.x}% ${asset.focal.y}%` } : undefined}
    />
  )
}

type MediaFrameProps = {
  asset: MediaAsset | null
  sizes: string
  priority?: boolean
  /** Links get the zoom, veil and plus on hover. A cover inside an article stays still. */
  interactive?: boolean
  className?: string
}

/** A cover framed like a page in a ledger: hairline edge and four registration marks in the corners. */
export const MediaFrame = ({ asset, sizes, priority, interactive = true, className }: MediaFrameProps) => (
  <div className={`media ${interactive ? 'media--interactive' : ''} ${className ?? ''}`}>
    {asset?.kind === 'image' && <Picture asset={asset} sizes={sizes} priority={priority} className="media__item" />}
    {asset?.kind === 'video' && (
      <>
        {asset.poster && (
          <Picture asset={asset.poster} sizes={sizes} priority={priority} className="media__item media__item--poster" />
        )}
        <AutoplayVideo className="media__item" src={asset.url} mimeType={asset.mimeType} label={asset.alt} />
      </>
    )}
    {interactive && (
      <>
        <span className="media__veil" aria-hidden="true" />
        <span className="media__plus" aria-hidden="true">
          <PlusIcon size={26} />
        </span>
      </>
    )}
    <span className="media__mark media__mark--ts" aria-hidden="true" />
    <span className="media__mark media__mark--te" aria-hidden="true" />
    <span className="media__mark media__mark--bs" aria-hidden="true" />
    <span className="media__mark media__mark--be" aria-hidden="true" />
  </div>
)

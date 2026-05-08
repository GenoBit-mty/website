import { useEffect } from 'react'

type Props = {
  images: string[]
  activeIndex: number | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  labels: { close: string; prev: string; next: string }
}

export function EventLightbox({ images, activeIndex, onClose, onPrev, onNext, labels }: Props) {
  useEffect(() => {
    if (activeIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onPrev()
      else if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [activeIndex, onClose, onPrev, onNext])

  if (activeIndex === null) return null
  const src = images[activeIndex]
  if (!src) return null

  const showNav = images.length > 1

  return (
    <div
      className="event-lightbox-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <img
        src={src}
        alt=""
        className="event-lightbox-image"
        onClick={(e) => e.stopPropagation()}
      />
      <button
        type="button"
        className="event-lightbox-btn close"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        aria-label={labels.close}
      >
        ×
      </button>
      {showNav && (
        <>
          <button
            type="button"
            className="event-lightbox-btn prev"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            aria-label={labels.prev}
          >
            ‹
          </button>
          <button
            type="button"
            className="event-lightbox-btn next"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            aria-label={labels.next}
          >
            ›
          </button>
        </>
      )}
    </div>
  )
}

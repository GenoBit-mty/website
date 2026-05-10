import { useEffect } from 'react'

type Props = {
  images: Array<string>
  activeIndex: number | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  labels: { close: string; prev: string; next: string }
}

const BTN_BASE =
  'absolute flex h-11 w-11 cursor-pointer items-center justify-center border border-[var(--gb-ink)] bg-[var(--gb-paper)] font-mono text-base text-[var(--gb-ink)] transition-colors duration-200 hover:bg-[var(--gb-ink)] hover:text-[var(--gb-paper)]'

export function EventLightbox({
  images,
  activeIndex,
  onClose,
  onPrev,
  onNext,
  labels,
}: Props) {
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
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(14,23,23,0.92)] p-[clamp(16px,4vw,48px)]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <img
        src={src}
        alt=""
        className="max-h-full max-w-full object-contain shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)]"
      />
      <button
        type="button"
        className={`${BTN_BASE} right-6 top-6`}
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
            className={`${BTN_BASE} left-6 top-1/2 -translate-y-1/2`}
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
            className={`${BTN_BASE} right-6 top-1/2 -translate-y-1/2`}
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

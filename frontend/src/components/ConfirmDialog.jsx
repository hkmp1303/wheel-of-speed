import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function ConfirmDialog({
  open,
  title,
  eyebrow,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}) {
  const dialogRef = useRef(null)
  const cancelButtonRef = useRef(null)

  useEffect(() => {
    if (!open) {
      if (dialogRef.current?.open) {
        dialogRef.current.close()
      }

      return undefined
    }

    const dialog = dialogRef.current
    if (dialog && !dialog.open) {
      dialog.showModal()
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusFrame = requestAnimationFrame(() => {
      cancelButtonRef.current?.focus()
    })

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      cancelAnimationFrame(focusFrame)
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onCancel])

  function handleDialogCancel(event) {
    event.preventDefault()
    onCancel()
  }

  function handleBackdropMouseDown(event) {
    const dialog = dialogRef.current
    if (!dialog) {
      return
    }

    const bounds = dialog.getBoundingClientRect()
    const clickedOutside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom

    if (clickedOutside) {
      onCancel()
    }
  }

  if (!open) {
    return null
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className="modal-window"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={handleDialogCancel}
      onMouseDown={handleBackdropMouseDown}
    >
      <section className="modal-panel">
        <button
          type="button"
          className="modal-close"
          aria-label="Close dialog"
          onClick={onCancel}
        >
          ×
        </button>
        <p className="modal-eyebrow">{eyebrow}</p>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-description" className="modal-description">{description}</p>
        <div className="modal-actions">
          <button ref={cancelButtonRef} type="button" className="modal-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="modal-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </dialog>,
    document.body,
  )
}
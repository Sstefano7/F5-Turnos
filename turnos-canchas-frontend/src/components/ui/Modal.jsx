import { useEffect } from "react"
import "./Modal.css"

export function Modal({ open, onClose, children, title }) {
  useEffect(() => {
    if (!open) return
    const onEsc = (e) => e.key === "Escape" && onClose?.()
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onEsc)
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onEsc) }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal__content animate-scaleIn" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        {title && (
          <div className="modal__header">
            <h3 className="modal__title">{title}</h3>
            <button className="modal__close" onClick={onClose} aria-label="Cerrar">×</button>
          </div>
        )}
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

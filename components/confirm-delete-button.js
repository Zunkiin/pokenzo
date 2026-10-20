'use client'

// Submit-knapp som spør "Er du sikker?" før skjemaet sendes.
export default function ConfirmDeleteButton({ message, className, children }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
    >
      {children}
    </button>
  )
}
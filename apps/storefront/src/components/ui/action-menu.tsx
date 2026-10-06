import { useState, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { EllipsisHorizontal } from "@medusajs/icons"

export interface ActionMenuItem {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: "default" | "danger" | "primary"
  disabled?: boolean
  loading?: boolean
}

interface ActionMenuProps {
  items: ActionMenuItem[]
}

export function ActionMenu({ items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const menuWidth = 192 // w-48
    setPosition({
      top: rect.bottom + 4,
      left: rect.right - menuWidth,
    })
  }, [])

  const toggle = useCallback(() => {
    if (!isOpen) {
      updatePosition()
    }
    setIsOpen((prev) => !prev)
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleScroll() {
      setIsOpen(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("scroll", handleScroll, true)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [isOpen])

  const getVariantClasses = (variant: ActionMenuItem["variant"] = "default") => {
    switch (variant) {
      case "danger":
        return "text-red-600 hover:bg-red-50"
      case "primary":
        return "text-teal-600 hover:bg-teal-50"
      default:
        return "text-gray-700 hover:bg-gray-50"
    }
  }

  if (items.length === 0) return null

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggle}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Open actions menu"
      >
        <EllipsisHorizontal className="w-5 h-5" />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: position.top, left: position.left }}
            className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
          >
            {items.map((item, index) => {
              const Icon = item.icon
              return (
                <button
                  key={index}
                  onClick={() => {
                    if (!item.disabled && !item.loading) {
                      item.onClick()
                      setIsOpen(false)
                    }
                  }}
                  disabled={item.disabled || item.loading}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses(item.variant)}`}
                >
                  {item.loading ? (
                    <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : Icon ? (
                    <Icon className="w-4 h-4" />
                  ) : null}
                  {item.label}
                </button>
              )
            })}
          </div>,
          document.body
        )}
    </div>
  )
}

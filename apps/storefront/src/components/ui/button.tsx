import { forwardRef, ButtonHTMLAttributes } from "react"

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover focus:ring-accent",
  secondary: "bg-slate-800 text-white hover:bg-slate-700 focus:ring-slate-500",
  outline: "border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary focus:ring-accent",
  ghost: "text-text-secondary hover:bg-surface-hover hover:text-text-primary focus:ring-accent",
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = "", 
    variant = "primary", 
    size = "md", 
    isLoading = false,
    disabled,
    children, 
    ...props 
  }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center gap-2
          font-medium rounded-lg
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-offset-2
          cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export default Button

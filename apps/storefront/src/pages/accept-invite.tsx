import { useState } from "react"
import { useNavigate, useParams, useSearch, Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/use-auth"
import { sdk } from "@/lib/utils/sdk"
import { User, BuildingsSolid } from "@medusajs/icons"

interface FormData {
  first_name: string
  last_name: string
  password: string
  confirm_password: string
}

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"
  const search = useSearch({ strict: false }) as { token?: string; email?: string; company?: string }
  const { token, email, company } = search

  const { login } = useAuth()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const [formData, setFormData] = useState<FormData>({
    first_name: "",
    last_name: "",
    password: "",
    confirm_password: "",
  })

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): string | null => {
    if (!formData.first_name.trim()) {
      return "First name is required"
    }
    if (!formData.last_name.trim()) {
      return "Last name is required"
    }
    if (formData.password.length < 8) {
      return "Password must be at least 8 characters"
    }
    if (formData.password !== formData.confirm_password) {
      return "Passwords do not match"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    const validationError = validateForm()
    if (validationError) {
      setSubmitError(validationError)
      return
    }

    setIsSubmitting(true)

    try {
      // Step 1: Register auth identity with email/password
      // This creates an unlinked auth identity and returns a token
      const registerToken = await sdk.auth.register("customer", "emailpass", {
        email: email!,
        password: formData.password,
      })

      if (!registerToken) {
        throw new Error("Failed to create authentication")
      }

      // Step 2: Accept the invite using the auth token
      // The SDK now has the token stored and will include it in requests
      await sdk.client.fetch("/store/employees/invites/accept", {
        method: "POST",
        body: {
          token,
          first_name: formData.first_name,
          last_name: formData.last_name,
        },
      })

      toast.success("Account created successfully! Logging you in...")

      // Log in the user (refresh the session)
      await login(email!, formData.password)

      // Navigate to the dashboard
      navigate({ to: "/$countryCode", params: { countryCode } })
    } catch (error: any) {
      console.error("Accept invite error:", error)
      let errorMessage: string
      if (error.message?.includes("already exists") || error.message?.includes("Identity with email already exists")) {
        errorMessage = "An account with this email already exists. Please sign in instead."
      } else if (error.message?.includes("expired") || error.message?.includes("Invalid")) {
        errorMessage = "This invite link is invalid or has expired. Please request a new invite."
      } else {
        errorMessage = error.message || "Failed to create account. Please try again."
      }
      setSubmitError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors text-text-primary placeholder-text-muted"
  const labelClass = "block text-sm font-medium text-text-primary mb-2"

  // Invalid token state (can't decode email)
  if (!token || !email) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="bg-surface rounded-2xl shadow-card border border-border p-8">
            <div className="w-16 h-16 bg-red-100 rounded-xl mx-auto mb-6 flex items-center justify-center">
              <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-text-primary mb-2">Invalid Invite</h1>
              <p className="text-text-secondary">
                {!token ? "No invite token provided" : "This invite link appears to be invalid"}
              </p>
            </div>
            <div className="space-y-3">
              <Link
                to="/$countryCode/account/login"
                params={{ countryCode }}
                className="block w-full py-3 px-4 bg-accent text-on-accent rounded-lg font-medium text-center hover:bg-accent-hover transition-colors"
              >
                Go to Sign In
              </Link>
              <Link
                to="/$countryCode"
                params={{ countryCode }}
                className="block w-full py-3 px-4 bg-surface border border-border text-text-primary rounded-lg font-medium text-center hover:bg-gray-50 transition-colors"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Form state
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-2xl shadow-card border border-border p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-accent-light rounded-xl mx-auto mb-6 flex items-center justify-center">
            {company ? (
              <BuildingsSolid style={{ width: 32, height: 32 }} className="text-accent" />
            ) : (
              <User style={{ width: 32, height: 32 }} className="text-accent" />
            )}
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">
              {company ? `Join ${company}` : "Accept Invite"}
            </h1>
            <p className="text-text-secondary">Complete your account setup to get started</p>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-error">{submitError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email (read-only) */}
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className={`${inputClass} bg-gray-50 cursor-not-allowed`}
                />
                <p className="mt-1 text-xs text-text-muted">This is your work email from the invite</p>
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="first_name" className={labelClass}>
                  First name <span className="text-error">*</span>
                </label>
                <input
                  id="first_name"
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => updateFormData("first_name", e.target.value)}
                  required
                  className={inputClass}
                  placeholder="John"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className={labelClass}>
                  Last name <span className="text-error">*</span>
                </label>
                <input
                  id="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => updateFormData("last_name", e.target.value)}
                  required
                  className={inputClass}
                  placeholder="Doe"
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className={labelClass}>
                  Password <span className="text-error">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Minimum 8 characters"
                />
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm_password" className={labelClass}>
                  Confirm password <span className="text-error">*</span>
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => updateFormData("confirm_password", e.target.value)}
                  required
                  autoComplete="new-password"
                  className={inputClass}
                  placeholder="Re-enter your password"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-accent text-on-accent rounded-lg font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-text-secondary text-sm">
              Already have an account?{" "}
              <Link
                to="/$countryCode/account/login"
                params={{ countryCode }}
                className="text-accent font-medium hover:text-accent-hover transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

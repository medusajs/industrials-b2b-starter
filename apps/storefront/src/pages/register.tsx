import { useState } from "react"
import { useNavigate, useParams, Link } from "@tanstack/react-router"
import { registerCompany } from "@/lib/data/company"
import { useAuth } from "@/lib/hooks/use-auth"
import { BuildingsSolid } from "@medusajs/icons"

type FormStep = "company" | "admin" | "review"

interface CompanyData {
  name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  postal_code: string
  country_code: string
}

interface AdminData {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "us"
  const { login } = useAuth()

  const [step, setStep] = useState<FormStep>("company")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const [companyData, setCompanyData] = useState<CompanyData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country_code: "us",
  })

  const [adminData, setAdminData] = useState<AdminData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  })

  const updateCompanyData = (field: keyof CompanyData, value: string) => {
    setCompanyData((prev) => ({ ...prev, [field]: value }))
  }

  const updateAdminData = (field: keyof AdminData, value: string) => {
    setAdminData((prev) => ({ ...prev, [field]: value }))
  }

  const validateCompanyStep = () => {
    if (!companyData.name.trim()) {
      setError("Company name is required")
      return false
    }
    if (!companyData.email.trim()) {
      setError("Company email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
      setError("Please enter a valid company email")
      return false
    }
    setError("")
    return true
  }

  const validateAdminStep = () => {
    if (!adminData.first_name.trim()) {
      setError("First name is required")
      return false
    }
    if (!adminData.last_name.trim()) {
      setError("Last name is required")
      return false
    }
    if (!adminData.email.trim()) {
      setError("Email is required")
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
      setError("Please enter a valid email")
      return false
    }
    if (adminData.password.length < 8) {
      setError("Password must be at least 8 characters")
      return false
    }
    if (adminData.password !== adminData.confirm_password) {
      setError("Passwords do not match")
      return false
    }
    setError("")
    return true
  }

  const handleNextStep = () => {
    if (step === "company" && validateCompanyStep()) {
      setStep("admin")
    } else if (step === "admin" && validateAdminStep()) {
      setStep("review")
    }
  }

  const handlePrevStep = () => {
    setError("")
    if (step === "admin") {
      setStep("company")
    } else if (step === "review") {
      setStep("admin")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Use the data layer function to handle the full registration flow atomically
      await registerCompany({
        email: adminData.email,
        password: adminData.password,
        company: {
          name: companyData.name,
          email: companyData.email,
          phone: companyData.phone || undefined,
          address: companyData.address || undefined,
          city: companyData.city || undefined,
          state: companyData.state || undefined,
          postal_code: companyData.postal_code || undefined,
          country_code: companyData.country_code || undefined,
        },
        admin: {
          first_name: adminData.first_name,
          last_name: adminData.last_name,
        },
      })

      // Log in the user using the auth hook to preserve state
      await login(adminData.email, adminData.password)

      // Navigate without full page reload to preserve auth state
      navigate({ to: "/$countryCode", params: { countryCode } })
    } catch (err: any) {
      console.error("Registration error:", err)
      if (err.message?.includes("already exists") || err.message?.includes("duplicate")) {
        setError("An account with this email already exists. Please sign in instead.")
      } else {
        setError(err.message || "Registration failed. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-8">
      {["company", "admin", "review"].map((s, index) => (
        <div key={s} className="flex items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === s
                ? "bg-accent text-accent-text"
                : ["company", "admin", "review"].indexOf(step) > index
                  ? "bg-accent text-accent-text"
                  : "bg-gray-200 text-text-muted"
            }`}
          >
            {index + 1}
          </div>
          {index < 2 && (
            <div
              className={`w-12 h-0.5 ${
                ["company", "admin", "review"].indexOf(step) > index ? "bg-accent" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  // Input class matching login page exactly
  const inputClass = "w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-colors text-text-primary placeholder-text-muted"
  const labelClass = "block text-sm font-medium text-text-primary mb-2"

  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md">
        {/* Registration Card */}
        <div className="bg-surface rounded-2xl shadow-card border border-border p-8">
          {/* Icon */}
          <div className="w-14 h-14 bg-accent-light rounded-xl flex items-center justify-center mx-auto mb-6">
            <BuildingsSolid className="w-7 h-7 text-accent" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-2">Create your account</h1>
            <p className="text-text-secondary">
              {step === "company" && "Tell us about your company"}
              {step === "admin" && "Set up your admin account"}
              {step === "review" && "Review your information"}
            </p>
          </div>

          {/* Step Indicator */}
          {stepIndicator}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-error">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={step === "review" ? handleSubmit : (e) => { e.preventDefault(); handleNextStep(); }}>
            {/* Company Information Step */}
            {step === "company" && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="company_name" className={labelClass}>
                    Company name <span className="text-error">*</span>
                  </label>
                  <input
                    id="company_name"
                    type="text"
                    value={companyData.name}
                    onChange={(e) => updateCompanyData("name", e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div>
                  <label htmlFor="company_email" className={labelClass}>
                    Company email <span className="text-error">*</span>
                  </label>
                  <input
                    id="company_email"
                    type="email"
                    value={companyData.email}
                    onChange={(e) => updateCompanyData("email", e.target.value)}
                    required
                    className={inputClass}
                    placeholder="info@acmecorp.com"
                  />
                </div>

                <div>
                  <label htmlFor="company_phone" className={labelClass}>
                    Phone number
                  </label>
                  <input
                    id="company_phone"
                    type="tel"
                    value={companyData.phone}
                    onChange={(e) => updateCompanyData("phone", e.target.value)}
                    className={inputClass}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label htmlFor="company_address" className={labelClass}>
                    Street address
                  </label>
                  <input
                    id="company_address"
                    type="text"
                    value={companyData.address}
                    onChange={(e) => updateCompanyData("address", e.target.value)}
                    className={inputClass}
                    placeholder="123 Business Ave"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company_city" className={labelClass}>
                      City
                    </label>
                    <input
                      id="company_city"
                      type="text"
                      value={companyData.city}
                      onChange={(e) => updateCompanyData("city", e.target.value)}
                      className={inputClass}
                      placeholder="San Francisco"
                    />
                  </div>
                  <div>
                    <label htmlFor="company_state" className={labelClass}>
                      State
                    </label>
                    <input
                      id="company_state"
                      type="text"
                      value={companyData.state}
                      onChange={(e) => updateCompanyData("state", e.target.value)}
                      className={inputClass}
                      placeholder="CA"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="company_postal" className={labelClass}>
                      Postal code
                    </label>
                    <input
                      id="company_postal"
                      type="text"
                      value={companyData.postal_code}
                      onChange={(e) => updateCompanyData("postal_code", e.target.value)}
                      className={inputClass}
                      placeholder="94102"
                    />
                  </div>
                  <div>
                    <label htmlFor="company_country" className={labelClass}>
                      Country
                    </label>
                    <select
                      id="company_country"
                      value={companyData.country_code}
                      onChange={(e) => updateCompanyData("country_code", e.target.value)}
                      className={`${inputClass} bg-surface`}
                    >
                      <option value="us">United States</option>
                      <option value="ca">Canada</option>
                      <option value="gb">United Kingdom</option>
                      <option value="de">Germany</option>
                      <option value="fr">France</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Admin Account Step */}
            {step === "admin" && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="admin_first_name" className={labelClass}>
                      First name <span className="text-error">*</span>
                    </label>
                    <input
                      id="admin_first_name"
                      type="text"
                      value={adminData.first_name}
                      onChange={(e) => updateAdminData("first_name", e.target.value)}
                      required
                      className={inputClass}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="admin_last_name" className={labelClass}>
                      Last name <span className="text-error">*</span>
                    </label>
                    <input
                      id="admin_last_name"
                      type="text"
                      value={adminData.last_name}
                      onChange={(e) => updateAdminData("last_name", e.target.value)}
                      required
                      className={inputClass}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="admin_email" className={labelClass}>
                    Email address <span className="text-error">*</span>
                  </label>
                  <input
                    id="admin_email"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => updateAdminData("email", e.target.value)}
                    required
                    className={inputClass}
                    placeholder="john@acmecorp.com"
                  />
                  <p className="mt-1 text-sm text-text-muted">This will be your login email</p>
                </div>

                <div>
                  <label htmlFor="admin_password" className={labelClass}>
                    Password <span className="text-error">*</span>
                  </label>
                  <input
                    id="admin_password"
                    type="password"
                    value={adminData.password}
                    onChange={(e) => updateAdminData("password", e.target.value)}
                    required
                    autoComplete="new-password"
                    className={inputClass}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div>
                  <label htmlFor="admin_confirm_password" className={labelClass}>
                    Confirm password <span className="text-error">*</span>
                  </label>
                  <input
                    id="admin_confirm_password"
                    type="password"
                    value={adminData.confirm_password}
                    onChange={(e) => updateAdminData("confirm_password", e.target.value)}
                    required
                    autoComplete="new-password"
                    className={inputClass}
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>
            )}

            {/* Review Step */}
            {step === "review" && (
              <div className="space-y-5">
                {/* Company Summary */}
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-text-primary">Company Information</h3>
                    <button
                      type="button"
                      onClick={() => setStep("company")}
                      className="text-sm text-accent hover:text-accent-hover cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-text-secondary">Name</dt>
                      <dd className="text-text-primary font-medium">{companyData.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-secondary">Email</dt>
                      <dd className="text-text-primary">{companyData.email}</dd>
                    </div>
                    {companyData.phone && (
                      <div className="flex justify-between">
                        <dt className="text-text-secondary">Phone</dt>
                        <dd className="text-text-primary">{companyData.phone}</dd>
                      </div>
                    )}
                    {companyData.address && (
                      <div className="flex justify-between">
                        <dt className="text-text-secondary">Address</dt>
                        <dd className="text-text-primary text-right">
                          {companyData.address}
                          {companyData.city && `, ${companyData.city}`}
                          {companyData.state && `, ${companyData.state}`}
                          {companyData.postal_code && ` ${companyData.postal_code}`}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Admin Summary */}
                <div className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-text-primary">Admin Account</h3>
                    <button
                      type="button"
                      onClick={() => setStep("admin")}
                      className="text-sm text-accent hover:text-accent-hover cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-text-secondary">Name</dt>
                      <dd className="text-text-primary font-medium">
                        {adminData.first_name} {adminData.last_name}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-text-secondary">Email</dt>
                      <dd className="text-text-primary">{adminData.email}</dd>
                    </div>
                  </dl>
                </div>

                {/* Terms */}
                <p className="text-sm text-text-muted text-center">
                  By creating an account, you agree to our{" "}
                  <a href="#" className="text-accent hover:text-accent-hover">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-accent hover:text-accent-hover">
                    Privacy Policy
                  </a>
                </p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step !== "company" && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 py-3 px-4 border border-border text-text-primary font-medium rounded-lg hover:bg-background focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-accent text-accent-text font-medium rounded-lg hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating account...
                  </span>
                ) : step === "review" ? (
                  "Create account"
                ) : (
                  "Continue"
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-sm text-text-muted">or</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Sign In Link */}
          <div className="text-center">
            <p className="text-text-secondary">
              Already have an account?{" "}
              <Link
                to="/$countryCode/account/login"
                params={{ countryCode }}
                className="text-accent hover:text-accent-hover font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-text-muted mt-6">
          Need help?{" "}
          <a href="mailto:support@proliftequipment.com" className="text-text-secondary hover:text-text-primary">
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}

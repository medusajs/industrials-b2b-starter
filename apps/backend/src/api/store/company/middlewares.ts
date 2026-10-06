import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

const SetupCompanySchema = z.object({
  // Auth credentials
  email: z.string().email("Valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  // Company data
  company_name: z.string().min(1, "Company name is required"),
  company_email: z.string().email("Valid company email is required"),
  company_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country_code: z.string().optional(),
  logo_url: z.string().url().optional(),
  // Admin customer data
  admin_first_name: z.string().min(1, "Admin first name is required"),
  admin_last_name: z.string().min(1, "Admin last name is required"),
  admin_phone: z.string().optional(),
})

const CreateCompanyAddressSchema = z.object({
  name: z.string().min(1, "Address label is required"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  company_name: z.string().nullable().optional(),
  address_1: z.string().min(1, "Address is required"),
  address_2: z.string().nullable().optional(),
  city: z.string().min(1, "City is required"),
  province: z.string().nullable().optional(),
  postal_code: z.string().min(1, "Postal code is required"),
  country_code: z.string().min(1, "Country is required"),
  phone: z.string().nullable().optional(),
  is_default_shipping: z.boolean().optional(),
  is_default_billing: z.boolean().optional(),
  is_billing_only: z.boolean().optional(),
})

const UpdateCompanyAddressSchema = z.object({
  name: z.string().min(1).optional(),
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  company_name: z.string().nullable().optional(),
  address_1: z.string().min(1).optional(),
  address_2: z.string().nullable().optional(),
  city: z.string().min(1).optional(),
  province: z.string().nullable().optional(),
  postal_code: z.string().min(1).optional(),
  country_code: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  is_default_shipping: z.boolean().optional(),
  is_default_billing: z.boolean().optional(),
  is_billing_only: z.boolean().optional(),
})

const UpdateMyCompanySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  spend_limit_reset_frequency: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).optional(),
})

export const companyMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/company",
    method: "POST",
    middlewares: [
      // No authentication required - this is a registration endpoint
      validateAndTransformBody(SetupCompanySchema),
    ],
  },
  {
    matcher: "/store/company/me",
    method: "POST",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformBody(UpdateMyCompanySchema),
    ],
  },
  {
    matcher: "/store/company/checkout-payment-methods",
    method: "GET",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/initiate-checkout-session",
    method: "POST",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/payment-methods",
    method: "GET",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/payment-methods",
    method: "POST",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/payment-methods/:id",
    method: "DELETE",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/addresses",
    method: "GET",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/addresses",
    method: "POST",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformBody(CreateCompanyAddressSchema),
    ],
  },
  {
    matcher: "/store/company/addresses/:id",
    method: "POST",
    middlewares: [
      authenticate("customer", ["bearer", "session"]),
      validateAndTransformBody(UpdateCompanyAddressSchema),
    ],
  },
  {
    matcher: "/store/company/addresses/:id",
    method: "DELETE",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/setup-status",
    method: "GET",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/orders",
    method: "GET",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
  {
    matcher: "/store/company/quotes",
    method: "GET",
    middlewares: [authenticate("customer", ["bearer", "session"])],
  },
]

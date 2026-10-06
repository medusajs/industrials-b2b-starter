import { defineMiddlewares } from "@medusajs/framework/http"

// Store middlewares
import { companyMiddlewares } from "./store/company/middlewares"
import { meMiddlewares } from "./store/me/middlewares"
import { employeesMiddlewares } from "./store/employees/middlewares"
import { storeQuotesMiddlewares } from "./store/quotes/middlewares"
import { dashboardMiddlewares } from "./store/dashboard/middlewares"
import { storeUploadsMiddlewares } from "./store/uploads/middlewares"
import { storeSearchMiddlewares } from "./store/search/middlewares"

// Admin middlewares
import { adminCompaniesMiddlewares } from "./admin/companies/middlewares"
import { adminQuotesMiddlewares } from "./admin/quotes/middlewares"

// Custom middlewares
import { requireCompanySetup } from "./middlewares/require-company-setup"

export default defineMiddlewares({
  routes: [
    // Store routes
    ...companyMiddlewares,
    ...meMiddlewares,
    ...employeesMiddlewares,
    ...storeQuotesMiddlewares,
    ...dashboardMiddlewares,
    ...storeUploadsMiddlewares,
    ...storeSearchMiddlewares,
    // Admin routes
    ...adminCompaniesMiddlewares,
    ...adminQuotesMiddlewares,
    // Protect cart completion and checkout session initiation
    // for B2B employees whose company setup is incomplete
    {
      matcher: "/store/carts/:id/complete",
      method: "POST",
      middlewares: [requireCompanySetup],
    },
    {
      matcher: "/store/company/initiate-checkout-session",
      method: "POST",
      middlewares: [requireCompanySetup],
    },
  ],
})

import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../modules/company";
import { CompanyStatus } from "../../modules/company/models/company";
import CompanyModuleService from "../../modules/company/service";

export type SetupCompanyInput = {
  // Auth credentials
  email: string;
  password: string;
  // Company data
  company_name: string;
  company_email: string;
  company_phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_code?: string;
  logo_url?: string;
  // Admin customer data
  admin_first_name: string;
  admin_last_name: string;
  admin_phone?: string;
};

/**
 * Step 1: Register auth identity with emailpass provider
 * This handles password hashing internally
 */
const registerAuthIdentityStep = createStep(
  "register-auth-identity-step",
  async (input: { email: string; password: string }, { container }) => {
    const authModuleService = container.resolve(Modules.AUTH) as any;

    const { success, authIdentity, error } = await authModuleService.register(
      "emailpass",
      {
        body: {
          email: input.email,
          password: input.password,
        },
      }
    );

    if (!success || error || !authIdentity) {
      throw new Error(error || "Failed to register auth identity");
    }

    return new StepResponse(authIdentity, authIdentity.id);
  },
  async (authIdentityId, { container }) => {
    if (!authIdentityId) return;

    const authModuleService = container.resolve(Modules.AUTH) as any;
    await authModuleService.deleteAuthIdentities([authIdentityId]);
  }
);

/**
 * Step 3: Create the company
 */
const createCompanyStep = createStep(
  "setup-create-company-step",
  async (input: SetupCompanyInput, { container }) => {
    const companyService = container.resolve(
      COMPANY_MODULE
    ) as CompanyModuleService;

    const company = await companyService.createCompanies({
      name: input.company_name,
      email: input.company_email,
      phone: input.company_phone,
      address: input.address,
      city: input.city,
      state: input.state,
      postal_code: input.postal_code,
      country_code: input.country_code,
      logo_url: input.logo_url,
      status: CompanyStatus.PENDING,
    });

    return new StepResponse(company, company.id);
  },
  async (companyId, { container }) => {
    if (!companyId) return;

    const companyService = container.resolve(
      COMPANY_MODULE
    ) as CompanyModuleService;
    await companyService.deleteCompanies(companyId);
  }
);

/**
 * Step 4: Create admin employee
 */
const createAdminEmployeeStep = createStep(
  "setup-create-admin-employee-step",
  async (input: { company_id: string; customer_id: string }, { container }) => {
    const companyService = container.resolve(
      COMPANY_MODULE
    ) as CompanyModuleService;

    const employee = await companyService.createEmployees({
      company_id: input.company_id,
      is_admin: true,
      spending_limit: null, // Admins have unlimited spending
    });

    return new StepResponse(employee, employee.id);
  },
  async (employeeId, { container }) => {
    if (!employeeId) return;

    const companyService = container.resolve(
      COMPANY_MODULE
    ) as CompanyModuleService;
    await companyService.deleteEmployees(employeeId);
  }
);

/**
 * Step 5: Link employee to customer
 */
const linkEmployeeToCustomerStep = createStep(
  "setup-link-employee-to-customer-step",
  async (
    input: { employee_id: string; customer_id: string },
    { container }
  ) => {
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any;

    await link.create({
      [COMPANY_MODULE]: {
        employee_id: input.employee_id,
      },
      [Modules.CUSTOMER]: {
        customer_id: input.customer_id,
      },
    });

    return new StepResponse(
      { employee_id: input.employee_id, customer_id: input.customer_id },
      { employee_id: input.employee_id, customer_id: input.customer_id }
    );
  },
  async (linkData, { container }) => {
    if (!linkData) return;

    const link = container.resolve(ContainerRegistrationKeys.LINK) as any;

    await link.dismiss({
      [COMPANY_MODULE]: {
        employee_id: linkData.employee_id,
      },
      [Modules.CUSTOMER]: {
        customer_id: linkData.customer_id,
      },
    });
  }
);

/**
 * Setup Company Workflow
 *
 * This workflow handles the complete company registration flow atomically:
 * 1. Register auth identity (emailpass)
 * 2. Create customer and link to auth identity
 * 3. Create company
 * 4. Create admin employee
 * 5. Link employee to customer
 *
 * If any step fails, all previous steps are rolled back.
 */
export const setupCompanyWorkflow = createWorkflow(
  "setup-company-workflow",
  function (input: SetupCompanyInput) {
    // Step 1: Register auth identity
    const authIdentity = registerAuthIdentityStep({
      email: input.email,
      password: input.password,
    });

    // Step 2: Create customer linked to auth identity using runAsStep
    const customerResult = createCustomerAccountWorkflow.runAsStep({
      input: {
        authIdentityId: authIdentity.id,
        customerData: {
          email: input.email,
          first_name: input.admin_first_name,
          last_name: input.admin_last_name,
          phone: input.admin_phone,
          company_name: input.company_name,
        },
      },
    });

    const customer = customerResult as any;

    // Step 3: Create company
    const company = createCompanyStep(input);

    // Step 4: Create admin employee
    const employee = createAdminEmployeeStep({
      company_id: company.id,
      customer_id: customer.id,
    });

    // Step 5: Link employee to customer
    linkEmployeeToCustomerStep({
      employee_id: employee.id,
      customer_id: customer.id,
    });

    return new WorkflowResponse({
      authIdentity,
      company,
      employee,
      customer,
    });
  }
);

export default setupCompanyWorkflow;

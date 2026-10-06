import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../modules/company";
import {
  CompanyStatus,
  SpendLimitResetFrequency,
} from "../../modules/company/models/company";
import CompanyModuleService from "../../modules/company/service";

type CreateCompanyInput = {
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
  spend_limit_reset_frequency?: SpendLimitResetFrequency;
  // Admin customer data
  admin_email: string;
  admin_first_name: string;
  admin_last_name: string;
  admin_phone?: string;
  // Auth identity ID from the auth registration
  auth_identity_id: string;
};

const createCompanyStep = createStep(
  "create-company-step",
  async (input: CreateCompanyInput, { container }) => {
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
      spend_limit_reset_frequency:
        input.spend_limit_reset_frequency ?? SpendLimitResetFrequency.NONE,
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

const createAdminEmployeeStep = createStep(
  "create-admin-employee-step",
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

const linkEmployeeToCustomerStep = createStep(
  "link-employee-to-customer-step",
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

export const createCompanyWorkflow = createWorkflow(
  "create-company-workflow",
  function (input: CreateCompanyInput) {
    // Step 1: Create the customer account (links auth identity to customer)
    const customerResult = createCustomerAccountWorkflow.runAsStep({
      input: {
        authIdentityId: input.auth_identity_id,
        customerData: {
          email: input.admin_email,
          first_name: input.admin_first_name,
          last_name: input.admin_last_name,
          phone: input.admin_phone,
          company_name: input.company_name,
        },
      },
    });

    const customer = customerResult as any;

    // Step 2: Create the company
    const company = createCompanyStep(input);

    // Step 3: Create the admin employee
    const employee = createAdminEmployeeStep({
      company_id: company.id,
      customer_id: customer.id,
    });

    // Step 4: Link employee to customer
    linkEmployeeToCustomerStep({
      employee_id: employee.id,
      customer_id: customer.id,
    });

    return new WorkflowResponse({
      company,
      employee,
      customer,
    });
  }
);

export default createCompanyWorkflow;

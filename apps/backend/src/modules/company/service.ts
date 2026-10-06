import { MedusaService } from "@medusajs/framework/utils"
import { Company } from "./models/company"
import { Employee } from "./models/employee"
import { CompanyAddress } from "./models/company-address"

class CompanyModuleService extends MedusaService({
  Company,
  Employee,
  CompanyAddress,
}) {}

export default CompanyModuleService

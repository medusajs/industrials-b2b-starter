import { defineLink } from "@medusajs/framework/utils"
import CustomerModule from "@medusajs/medusa/customer"
import CompanyModule from "../modules/company"

export default defineLink(
  {
    linkable: CompanyModule.linkable.employee,
  },
  {
    linkable: CustomerModule.linkable.customer,
    deleteCascade: true,
  }
)

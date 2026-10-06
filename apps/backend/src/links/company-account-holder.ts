import { defineLink } from "@medusajs/framework/utils"
import PaymentModule from "@medusajs/medusa/payment"
import CompanyModule from "../modules/company"

export default defineLink(
  CompanyModule.linkable.company,
  PaymentModule.linkable.accountHolder
)

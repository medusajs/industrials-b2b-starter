import { model } from "@medusajs/framework/utils"
import { Company } from "./company"

export const CompanyAddress = model.define("company_address", {
  id: model.id().primaryKey(),
  name: model.text(),
  first_name: model.text(),
  last_name: model.text(),
  company_name: model.text().nullable(),
  address_1: model.text(),
  address_2: model.text().nullable(),
  city: model.text(),
  province: model.text().nullable(),
  postal_code: model.text(),
  country_code: model.text(),
  phone: model.text().nullable(),
  is_default_shipping: model.boolean().default(false),
  is_default_billing: model.boolean().default(false),
  is_billing_only: model.boolean().default(false),
  company: model.belongsTo(() => Company, {
    mappedBy: "addresses",
  }),
})

export default CompanyAddress

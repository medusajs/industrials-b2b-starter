import { model } from "@medusajs/framework/utils"
import { Employee } from "./employee"
import { CompanyAddress } from "./company-address"

export enum CompanyStatus {
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum SpendLimitResetFrequency {
  NONE = "none",
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export const Company = model.define("company", {
  id: model.id().primaryKey(),
  name: model.text(),
  email: model.text().unique(),
  phone: model.text().nullable(),
  address: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  postal_code: model.text().nullable(),
  country_code: model.text().nullable(),
  logo_url: model.text().nullable(),
  status: model.enum(CompanyStatus).default(CompanyStatus.PENDING),
  spend_limit_reset_frequency: model
    .enum(SpendLimitResetFrequency)
    .default(SpendLimitResetFrequency.NONE),
  employees: model.hasMany(() => Employee, {
    mappedBy: "company",
  }),
  addresses: model.hasMany(() => CompanyAddress, {
    mappedBy: "company",
  }),
})

export default Company

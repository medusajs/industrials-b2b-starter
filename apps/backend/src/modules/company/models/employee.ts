import { model } from "@medusajs/framework/utils"
import { Company } from "./company"

export const Employee = model.define("employee", {
  id: model.id().primaryKey(),
  is_admin: model.boolean().default(false),
  spending_limit: model.bigNumber().nullable(),
  company: model.belongsTo(() => Company, {
    mappedBy: "employees",
  }),
})

export default Employee

import { defineLink } from "@medusajs/framework/utils"
import QuoteModule from "../modules/quote"
import OrderModule from "@medusajs/medusa/order"

export default defineLink(
  {
    linkable: QuoteModule.linkable.quote,
    field: "order_change_id",
  },
  {
    linkable: OrderModule.linkable.orderChange,
  },
  {
    readOnly: true,
  }
)

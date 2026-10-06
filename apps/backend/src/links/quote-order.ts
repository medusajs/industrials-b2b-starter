import { defineLink } from "@medusajs/framework/utils"
import QuoteModule from "../modules/quote"
import OrderModule from "@medusajs/medusa/order"

export default defineLink(
  {
    linkable: QuoteModule.linkable.quote,
    field: "draft_order_id",
  },
  // eslint-disable-next-line @medusajs/read-only-link-requires-field -- spread form is required to generate the `draft_order` relation queried by customer-accept-quote
  {
    ...OrderModule.linkable.order.id,
    alias: "draft_order",
  },
  {
    readOnly: true,
  }
)

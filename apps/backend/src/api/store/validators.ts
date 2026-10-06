import { z } from "@medusajs/framework/zod"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export type CreateQuoteType = z.infer<typeof CreateQuote>
export const CreateQuote = z
  .object({
    cart_id: z.string().min(1),
  })
  .strict()

export type GetQuoteParamsType = z.infer<typeof GetQuoteParams>
export const GetQuoteParams = createFindParams({
  limit: 15,
  offset: 0,
})

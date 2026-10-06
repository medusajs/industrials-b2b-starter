import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { MIMEType } from "util"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { filename, mime_type, access } = req.validatedBody as {
    filename: string
    mime_type: string
    access?: string
  }

  let type: MIMEType
  try {
    type = new MIMEType(mime_type)
  } catch {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid file type "${mime_type}"`
    )
  }

  const extension = type.subtype
  const uniqueFilename = `${crypto.randomUUID()}.${extension}`

  const fileProvider = req.scope.resolve(Modules.FILE) as any
  const response = await fileProvider.getUploadFileUrls({
    filename: uniqueFilename,
    mimeType: mime_type,
    access: access ?? "public",
  })

  res.status(200).json({
    url: response.url,
    file_key: response.key,
  })
}

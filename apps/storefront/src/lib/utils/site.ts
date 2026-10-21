import { createIsomorphicFn } from "@tanstack/react-start"
import { getRequestUrl } from "@tanstack/react-start/server"

export const STORE_NAME = "ProLift Equipment"

const configuredUrl = (import.meta.env.VITE_STOREFRONT_URL as string | undefined)?.replace(
  /\/+$/,
  ""
)

export const getStorefrontUrl = createIsomorphicFn()
  .server(() => configuredUrl || getRequestUrl().origin)
  .client(() => configuredUrl || window.location.origin)

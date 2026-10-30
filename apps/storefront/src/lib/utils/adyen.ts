export const adyenClientKey = import.meta.env.VITE_ADYEN_CLIENT_KEY || ""
export const adyenEnvironment =
  import.meta.env.VITE_ADYEN_ENVIRONMENT === "live" ? "live" : "test"

import { sdk } from "@/lib/utils/sdk"
import { HttpTypes } from "@medusajs/types"
import { cachedOnServer } from "@/lib/utils/server-cache"

const REGIONS_TTL_MS = 5 * 60 * 1000
const REGIONS_STALE_MS = 24 * 60 * 60 * 1000

// Every caller shares one field set so the server cache holds a single regions entry.
const REGION_FIELDS = "id,name,currency_code,metadata,*countries"

export const listRegions = async (): Promise<HttpTypes.StoreRegion[]> => {
  const { regions } = await cachedOnServer(
    "regions",
    REGIONS_TTL_MS,
    () => sdk.store.region.list({ fields: REGION_FIELDS }),
    REGIONS_STALE_MS
  )
  return regions
}

export const retrieveRegion = async ({
  id,
  fields,
}: {
  id: string;
  fields?: string;
}): Promise<HttpTypes.StoreRegion> => {
  const { region } = await sdk.store.region.retrieve(id, { fields })
  return region
}

export const getRegion = async ({
  country_code,
}: {
  country_code: string;
}): Promise<HttpTypes.StoreRegion | null> => {
    const regions = await listRegions()
    return regions.find(region => 
      region.countries?.some(country => country.iso_2 === country_code.toLowerCase())
    ) || null
}
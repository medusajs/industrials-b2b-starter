import { sdk } from "@/lib/utils/sdk"
import { HttpTypes } from "@medusajs/types"
import { cachedOnServer } from "@/lib/utils/server-cache"

const REGIONS_TTL_MS = 5 * 60 * 1000
const REGIONS_STALE_MS = 24 * 60 * 60 * 1000

export const listRegions = async ({
  fields,
}: {
  fields?: string;
} = {}): Promise<HttpTypes.StoreRegion[]> => {
  const { regions } = await cachedOnServer(
    `regions:${fields ?? ""}`,
    REGIONS_TTL_MS,
    () => sdk.store.region.list({ fields }),
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
  fields,
}: {
  country_code: string;
  fields?: string;
}): Promise<HttpTypes.StoreRegion | null> => {
    const regions = await listRegions({ fields })
    return regions.find(region => 
      region.countries?.some(country => country.iso_2 === country_code.toLowerCase())
    ) || null
}
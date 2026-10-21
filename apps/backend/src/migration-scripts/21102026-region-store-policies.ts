import { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows";
import { getDefaultRegionStorePolicies } from "../utils/region-store-policies";

export default async function migration_21102026_region_store_policies({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "metadata", "countries.iso_2"],
  });

  for (const region of regions) {
    const defaults = getDefaultRegionStorePolicies(
      (region.countries ?? []).map((country) => country?.iso_2 ?? "")
    );
    if (!defaults) {
      continue;
    }

    const metadata = region.metadata ?? {};
    const missing = Object.fromEntries(
      Object.entries(defaults).filter(([key]) => metadata[key] === undefined)
    );
    if (!Object.keys(missing).length) {
      continue;
    }

    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { metadata: { ...metadata, ...missing } },
      },
    });
    logger.info(`Added store policy defaults to region "${region.name}"`);
  }
}

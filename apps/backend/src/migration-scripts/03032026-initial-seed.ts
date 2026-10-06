import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createDefaultsWorkflow,
  updateStoresWorkflow,
  createRegionsWorkflow,
  createTaxRegionsWorkflow,
  createStockLocationsWorkflow,
  createShippingProfilesWorkflow,
  createShippingOptionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createProductOptionsWorkflow,
  linkProductsToSalesChannelWorkflow,
  createInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows";
import { CreateProductCategoryDTO, MedusaContainer } from "@medusajs/framework/types";

export default async function migration_03032026_initial_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const { data: existingProductsAtStartup } = await query.graph({
    entity: "product",
    fields: ["id"],
  });

  // If we want to explicitly not seed data, or if it's an existing project with data seeded in a different way, skip the seeding.
  if (
    process.env.SKIP_INITIAL_SEED === "true" ||
    existingProductsAtStartup.length > 0
  ) {
    return;
  }

  logger.info("Seeding defaults...");
  await createDefaultsWorkflow(container).run();

  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "usd", is_default: true },
          { currency_code: "eur", is_tax_inclusive: true },
          { currency_code: "gbp", is_tax_inclusive: true },
          { currency_code: "dkk", is_tax_inclusive: true },
        ],
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });

  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
  });

  if (!existingRegions.length) {
    logger.info("Creating regions...");
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "United States",
            currency_code: "usd",
            countries: ["us"],
            payment_providers: ["pp_system_default"],
            automatic_taxes: false,
            is_tax_inclusive: false,
          },
          {
            name: "Europe",
            currency_code: "eur",
            countries: ["de", "se", "fr", "es", "it"],
            payment_providers: ["pp_system_default"],
            automatic_taxes: true,
            is_tax_inclusive: true,
          },
          {
            name: "United Kingdom",
            currency_code: "gbp",
            countries: ["gb"],
            payment_providers: ["pp_system_default"],
            automatic_taxes: true,
            is_tax_inclusive: true,
          },
          {
            name: "Denmark",
            currency_code: "dkk",
            countries: ["dk"],
            payment_providers: ["pp_system_default"],
            automatic_taxes: true,
            is_tax_inclusive: true,
          },
        ],
      },
    });
  } else {
    logger.info("Regions already exist, skipping creation...");
  }

  const { data: existingTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "name"],
  });

  if (!existingTaxRegions.length) {
    logger.info("Seeding tax regions...");
    const taxRates: Record<
      string,
      { rate: number; code: string; name: string }
    > = {
      gb: { rate: 20, code: "GB20", name: "UK VAT" },
      de: { rate: 19, code: "DE19", name: "Germany VAT" },
      dk: { rate: 25, code: "DK25", name: "Denmark VAT" },
      se: { rate: 25, code: "SE25", name: "Sweden VAT" },
      fr: { rate: 20, code: "FR20", name: "France VAT" },
      es: { rate: 21, code: "ES21", name: "Spain VAT" },
      it: { rate: 22, code: "IT22", name: "Italy VAT" },
    };

    await createTaxRegionsWorkflow(container).run({
      input: Object.entries(taxRates).map(([country_code, taxConfig]) => {
        return {
          country_code,
          provider_id: "tp_system",
          default_tax_rate: {
            rate: taxConfig.rate,
            code: taxConfig.code,
            name: taxConfig.name,
            is_default: true,
          },
        };
      }),
    });

    logger.info("Finished seeding tax regions.");
  } else {
    logger.info("Tax regions already exist, skipping creation...");
  }

  const { data: existingStockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });

  let stockLocation;
  if (!existingStockLocations.length) {
    logger.info("Seeding stock location data...");
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
      container
    ).run({
      input: {
        locations: [
          {
            name: "Main Warehouse",
            address: {
              city: "Copenhagen",
              country_code: "DK",
              address_1: "123 Main St",
            },
          },
        ],
      },
    });
    stockLocation = stockLocationResult[0];

    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: "manual_manual",
      },
    });
  } else {
    logger.info("Stock location already exists, skipping creation...");
    stockLocation = existingStockLocations[0];
  }

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile;

  if (!shippingProfiles.length) {
    logger.info("Creating shipping profile...");
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  } else {
    logger.info("Shipping profile already exists, skipping creation...");
    shippingProfile = shippingProfiles[0];
  }

  const fulfillmentSets = await fulfillmentModuleService.listFulfillmentSets();

  let fulfillmentSet;
  if (!fulfillmentSets.length) {
    logger.info("Creating fulfillment set...");
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Main Warehouse Delivery",
      type: "shipping",
      service_zones: [
        {
          name: "Worldwide",
          geo_zones: ["us", "de", "se", "fr", "es", "it", "gb", "dk"].map(
            (country_code) => ({
              country_code,
              type: "country" as const,
            })
          ),
        },
      ],
    });

    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_set_id: fulfillmentSet.id,
      },
    });
  } else {
    logger.info("Fulfillment set already exists, skipping creation...");
    fulfillmentSet = fulfillmentSets[0];
  }

  const { data: existingShippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  });

  if (!existingShippingOptions.length) {
    logger.info("Creating shipping option...");
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Worldwide Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard",
            description: "Ships worldwide",
            code: "standard-worldwide",
          },
          prices: [
            {
              currency_code: "usd",
              amount: 10,
            },
            {
              currency_code: "eur",
              amount: 10,
            },
            {
              currency_code: "gbp",
              amount: 10,
            },
            {
              currency_code: "dkk",
              amount: 10,
            },
          ],
          rules: [
            {
              attribute: "enabled_in_store",
              value: "true",
              operator: "eq",
            },
            {
              attribute: "is_return",
              value: "false",
              operator: "eq",
            },
          ],
        },
      ],
    });
  } else {
    logger.info("Shipping option already exists, skipping creation...");
  }

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });

  // ─── Product Categories ──────────────────────────────────────────
  // Seed product categories with nesting
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "name"],
  });
  const categoryHandles = existingCategories.map((c: any) => c.handle);
  const categoriesToCreate: CreateProductCategoryDTO[] = [];
  const categoriesInput: CreateProductCategoryDTO[] = [
    {
      name: "Forklift Parts",
      handle: "forklift-parts",
      description:
        "Essential replacement parts for forklifts including forks, batteries, and tires",
      is_active: true,
      is_internal: false,
      rank: 0,
    },
    {
      name: "Safety Equipment",
      handle: "safety-equipment",
      description:
        "Safety lights, alarms, mirrors and other equipment to keep your warehouse safe",
      is_active: true,
      is_internal: false,
      rank: 1,
    },
    {
      name: "Attachments",
      handle: "attachments",
      description:
        "Specialized forklift attachments for handling various materials",
      is_active: true,
      is_internal: false,
      rank: 2,
    },
    {
      name: "Warehouse Equipment",
      handle: "warehouse-equipment",
      description:
        "Essential warehouse infrastructure including racking, dock equipment, and storage solutions",
      is_active: true,
      is_internal: false,
      rank: 3,
    },
    {
      name: "Material Handling",
      handle: "material-handling",
      description:
        "Conveyors, pallet jacks, and equipment for moving materials efficiently",
      is_active: true,
      is_internal: false,
      rank: 4,
    },
    {
      name: "Operator Accessories",
      handle: "operator-accessories",
      description:
        "Personal protective equipment and accessories for forklift operators",
      is_active: true,
      is_internal: false,
      rank: 5,
    },
  ];

  categoriesInput.forEach((category) => {
    if (!categoryHandles.includes(category.handle)) {
      categoriesToCreate.push(category);
    }
  });

  if (categoriesToCreate.length > 0) {
    logger.info("Seeding product categories...");
    const { result: categories } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: categoriesToCreate,
      },
    });
  } else {
    logger.info("Product categories already exist, skipping creation...");
  }

  // Get updated categories including newly created ones
  const { data: allCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "name"],
  });

  const catMap: Record<string, string> = {};
  for (const c of allCategories) {
    catMap[c.handle] = c.id;
  }

  // ─── Products ────────────────────────────────────────────────────
  // Seed products
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  });

  const existingHandles = existingProducts.map((p: any) => p.handle);
  const productsToCreate = [
    // --- Forklift Parts ---
    {
      title: "Heavy-Duty Forklift Forks",
      handle: "heavy-duty-forklift-forks",
      description:
        "Premium steel forklift forks designed for maximum durability and load capacity. Features reinforced heel section and precision-forged tips for smooth pallet entry. Compatible with Class II, III, and IV carriages.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["forklift-parts"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FND3QK3Y2K2SGXKG4YMVQ-01KJ5FND3RBMKP7VPXKEZXDMTT.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNE5BCEF8357G43FAMQ82-01KJ5FNE5B97Q25MCFXY720WRK.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNFNTHANCBD7DQ7FR8Y7J-01KJ5FNFNTFJS6SQEJ33B65CMX.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FND3QK3Y2K2SGXKG4YMVQ-01KJ5FND3RBMKP7VPXKEZXDMTT.jpeg",
      options: [{ title: "Length", values: ["42 inch", "48 inch", "60 inch"] }],
      variants: [
        {
          title: "42 inch",
          sku: "FORK-42",
          options: { Length: "42 inch" },
          manage_inventory: true,
          prices: [
            { amount: 450, currency_code: "usd" },
            { amount: 420, currency_code: "eur" },
          ],
        },
        {
          title: "48 inch",
          sku: "FORK-48",
          options: { Length: "48 inch" },
          manage_inventory: true,
          prices: [
            { amount: 520, currency_code: "usd" },
            { amount: 485, currency_code: "eur" },
          ],
        },
        {
          title: "60 inch",
          sku: "FORK-60",
          options: { Length: "60 inch" },
          manage_inventory: true,
          prices: [
            { amount: 680, currency_code: "usd" },
            { amount: 635, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Industrial Forklift Battery",
      handle: "industrial-forklift-battery",
      description:
        "High-capacity lead-acid battery designed for electric forklifts. Provides extended runtime and reliable performance. Features maintenance-free design with built-in water level indicator.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["forklift-parts"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNME574RR96MYX98GYZF0-01KJ5FNME528ERJ1PPD6R08C46.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNN7P2DGKRJW0GHKQYN95-01KJ5FNN7PKEJV3FTSY0JDBARQ.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNME574RR96MYX98GYZF0-01KJ5FNME528ERJ1PPD6R08C46.jpeg",
      options: [{ title: "Voltage", values: ["24V", "36V", "48V"] }],
      variants: [
        {
          title: "24V Battery",
          sku: "BATT-24V",
          options: { Voltage: "24V" },
          manage_inventory: true,
          prices: [
            { amount: 1200, currency_code: "usd" },
            { amount: 1120, currency_code: "eur" },
          ],
        },
        {
          title: "36V Battery",
          sku: "BATT-36V",
          options: { Voltage: "36V" },
          manage_inventory: true,
          prices: [
            { amount: 1650, currency_code: "usd" },
            { amount: 1540, currency_code: "eur" },
          ],
        },
        {
          title: "48V Battery",
          sku: "BATT-48V",
          options: { Voltage: "48V" },
          manage_inventory: true,
          prices: [
            { amount: 2100, currency_code: "usd" },
            { amount: 1960, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Pneumatic Forklift Tires",
      handle: "pneumatic-forklift-tires",
      description:
        "Heavy-duty pneumatic tires for outdoor forklift use. Deep tread pattern provides excellent traction on rough terrain. Puncture-resistant construction for extended service life.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["forklift-parts"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNP7W8WSAXJQPRJZQEFSB-01KJ5FNP7WARHK5M7FQT4KK6H6.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNPWEH19KAQWF34KPXR4W-01KJ5FNPWFFXTKNB0RM3KD71H2.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNP7W8WSAXJQPRJZQEFSB-01KJ5FNP7WARHK5M7FQT4KK6H6.jpeg",
      options: [{ title: "Size", values: ["6.50-10", "7.00-12", "8.25-15"] }],
      variants: [
        {
          title: "6.50-10",
          sku: "TIRE-650",
          options: { Size: "6.50-10" },
          manage_inventory: true,
          prices: [
            { amount: 185, currency_code: "usd" },
            { amount: 170, currency_code: "eur" },
          ],
        },
        {
          title: "7.00-12",
          sku: "TIRE-700",
          options: { Size: "7.00-12" },
          manage_inventory: true,
          prices: [
            { amount: 220, currency_code: "usd" },
            { amount: 205, currency_code: "eur" },
          ],
        },
        {
          title: "8.25-15",
          sku: "TIRE-825",
          options: { Size: "8.25-15" },
          manage_inventory: true,
          prices: [
            { amount: 295, currency_code: "usd" },
            { amount: 275, currency_code: "eur" },
          ],
        },
      ],
    },
    // --- Safety Equipment ---
    {
      title: "LED Safety Light Kit",
      handle: "led-safety-light-kit",
      description:
        "Complete LED safety lighting kit including blue spot light and strobe warning light. Highly visible in all lighting conditions. Easy installation with universal mounting brackets.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["safety-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNW0825AG6C70NZD3FV1A-01KJ5FNW09YD5CQ1SRJYHZJ2C5.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNWNHKV5HZVVEWCJ124AA-01KJ5FNWNHJRF475MYHM3YZ7PF.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNW0825AG6C70NZD3FV1A-01KJ5FNW09YD5CQ1SRJYHZJ2C5.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "LED Safety Light Kit",
          sku: "LED-SAFETY-KIT",
          options: { "Default option": "Default option value" },
          manage_inventory: true,
          prices: [
            { amount: 145, currency_code: "usd" },
            { amount: 135, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Backup Alarm System",
      handle: "backup-alarm-system",
      description:
        "Industrial-grade backup alarm system with 97-112 dB adjustable sound level. Weather-resistant housing suitable for indoor and outdoor use. Automatic activation when reverse gear is engaged.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["safety-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNXKYFHD7DSZR96RKHRKK-01KJ5FNXKYXT7W9VBH1EJF7XYV.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNYA01QM6R8R00RYAWMRM-01KJ5FNYA0JBJ6YP7MESF6EANZ.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FNXKYFHD7DSZR96RKHRKK-01KJ5FNXKYXT7W9VBH1EJF7XYV.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Backup Alarm System",
          sku: "ALARM-BACKUP",
          options: { "Default option": "Default option value" },
          manage_inventory: true,
          prices: [
            { amount: 65, currency_code: "usd" },
            { amount: 60, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Wide-Angle Mirror Set",
      handle: "wide-angle-mirror-set",
      description:
        "Convex safety mirrors providing 180-degree field of view. Eliminates blind spots and improves operator visibility. Includes adjustable mounting brackets for universal fitment.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["safety-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FP5WBH9WTX6731B7SD3YP-01KJ5FP5WBTMPNARGF9X0X5PHA.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FP75HN6R57T6WWVSDZW45-01KJ5FP75H557F17QED8HF9E8Y.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FP5WBH9WTX6731B7SD3YP-01KJ5FP5WBTMPNARGF9X0X5PHA.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Wide-Angle Mirror Set",
          sku: "MIRROR-SET",
          options: { "Default option": "Default option value" },
          manage_inventory: true,
          prices: [
            { amount: 89, currency_code: "usd" },
            { amount: 82, currency_code: "eur" },
          ],
        },
      ],
    },
    // --- Attachments ---
    {
      title: "Carton Clamp Attachment",
      handle: "carton-clamp-attachment",
      description:
        "Hydraulic carton clamp for handling appliances, cartons, and baled materials. Features pressure-sensitive pads to prevent product damage. Compatible with most forklift carriages.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["attachments"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FP7S0M127QMPVFK553483-01KJ5FP7S09E9XBFH8AJG7PAW7.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FP8EZY4GTJ61HKR66VZ0X-01KJ5FP8EZBBN92Z55XBWC1EHR.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FP7S0M127QMPVFK553483-01KJ5FP7S09E9XBFH8AJG7PAW7.jpeg",
      options: [{ title: "Capacity", values: ["4,000 lbs", "6,000 lbs"] }],
      variants: [
        {
          title: "4,000 lbs Capacity",
          sku: "CLAMP-4000",
          options: { Capacity: "4,000 lbs" },
          manage_inventory: true,
          prices: [
            { amount: 3200, currency_code: "usd" },
            { amount: 2980, currency_code: "eur" },
          ],
        },
        {
          title: "6,000 lbs Capacity",
          sku: "CLAMP-6000",
          options: { Capacity: "6,000 lbs" },
          manage_inventory: true,
          prices: [
            { amount: 4100, currency_code: "usd" },
            { amount: 3820, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Fork Positioner",
      handle: "fork-positioner",
      description:
        "Hydraulic fork positioner allows operator to adjust fork width from the seat. Increases productivity by reducing manual adjustment time. Features side-shifting capability.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["attachments"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FPCWFJJJHRD3ME4SPJQ99-01KJ5FPCWF3VTFH18WJDWBY93H.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FPE2GQ1JZVVTDR2SVJHY4-01KJ5FPE2GM6JESRVQNGK9YMB5.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FPCWFJJJHRD3ME4SPJQ99-01KJ5FPCWF3VTFH18WJDWBY93H.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Fork Positioner",
          sku: "FORK-POS",
          options: { "Default option": "Default option value" },
          manage_inventory: true,
          prices: [
            { amount: 2750, currency_code: "usd" },
            { amount: 2560, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Drum Handler Attachment",
      handle: "drum-handler-attachment",
      description:
        "Heavy-duty drum handling attachment for 55-gallon steel and plastic drums. Features automatic drum grip mechanism. Can handle both upright and horizontal drum positions.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["attachments"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FPF0WBDR32DK8QWAXV907-01KJ5FPF0WRKJNX4AZD6D6Q6P9.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FPHPHWK7GCGHGM81RPS3V-01KJ5FPHPHM9648SEH12FJQZ87.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5FPF0WBDR32DK8QWAXV907-01KJ5FPF0WRKJNX4AZD6D6Q6P9.jpeg",
      options: [{ title: "Type", values: ["Single Drum", "Double Drum"] }],
      variants: [
        {
          title: "Single Drum Handler",
          sku: "DRUM-SINGLE",
          options: { Type: "Single Drum" },
          manage_inventory: true,
          prices: [
            { amount: 890, currency_code: "usd" },
            { amount: 830, currency_code: "eur" },
          ],
        },
        {
          title: "Double Drum Handler",
          sku: "DRUM-DOUBLE",
          options: { Type: "Double Drum" },
          manage_inventory: true,
          prices: [
            { amount: 1450, currency_code: "usd" },
            { amount: 1350, currency_code: "eur" },
          ],
        },
      ],
    },
    // --- Safety Equipment (additional) ---
    {
      title: "Fire Extinguisher Bracket",
      handle: "fire-extinguisher-bracket",
      description:
        "Heavy-duty steel mounting bracket designed to secure a fire extinguisher to the forklift frame. Quick-release strap allows fast access in emergencies. Powder-coated for corrosion resistance.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["safety-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5YBTN5MW71Q5Z2T9TH6D9-01KJD5YBTPPBGK5H7QMG0T5CN8.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBS3R49VGH2PZG2WDKWRNR-01KJEBS3R4N7EKN2YE5YFMG62S.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5YBTN5MW71Q5Z2T9TH6D9-01KJD5YBTPPBGK5H7QMG0T5CN8.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Fire Extinguisher Bracket",
          sku: "FEB-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 45, currency_code: "usd" },
            { amount: 42, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Safety Flag Kit",
      handle: "safety-flag-kit",
      description:
        "High-visibility orange safety flags on flexible fiberglass poles. Mount to the overhead guard or counterweight to make the forklift visible in busy traffic areas.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["safety-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5YCPZW1A381PSHTA5XN9M-01KJD5YCPZP9XSBE0AABP1FMNZ.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBS5DG2HQ8Q6ZNP87V40X5-01KJEBS5DH5B939C0SBY6HMAPA.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5YCPZW1A381PSHTA5XN9M-01KJD5YCPZP9XSBE0AABP1FMNZ.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Safety Flag Kit",
          sku: "SFK-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 35, currency_code: "usd" },
            { amount: 32, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "First Aid Kit",
      handle: "first-aid-kit",
      description:
        "Compact first aid kit stocked with bandages, antiseptic wipes, cold packs, and essential supplies for common workplace injuries. Hard-shell case mounts to the forklift or wall.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["safety-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5YDBVWAXAA34HMDR8A5J6-01KJD5YDBWCP6A7RJD5WQ45YPA.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBS6FDB9ZMY9W9X79C510J-01KJEBS6FD4XNCJ8NTARE8G6C5.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5YDBVWAXAA34HMDR8A5J6-01KJD5YDBWCP6A7RJD5WQ45YPA.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "First Aid Kit",
          sku: "FAK-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 75, currency_code: "usd" },
            { amount: 70, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Safety Vest - High Visibility",
      handle: "safety-vest",
      description:
        "ANSI Class 2 high-visibility safety vest with 360-degree reflective striping. Breathable mesh construction. Multiple pockets for radios, pens, and ID badges.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["safety-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5YF1Q6BK0HKJCS1SZ6XN5-01KJD5YF1Q296P79X3KS4V.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5YF1Q6BK0HKJCS1SZ6XN5-01KJD5YF1Q296P79X3KS4V.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Safety Vest",
          sku: "SV-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 18, currency_code: "usd" },
            { amount: 16, currency_code: "eur" },
          ],
        },
      ],
    },
    // --- Warehouse Equipment ---
    {
      title: "Pallet Racking System",
      handle: "pallet-racking-system",
      description:
        "Heavy-duty selective pallet racking for warehouse storage. Steel construction with 30,000 lb capacity per section.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["warehouse-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1B6GHNCF7BMDFK118BEP-01KJ5G1B6GZPZX99R1KM440GA5.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1C4RRAPFAY0HVXBEQQNK-01KJ5G1C4RXDW2P7DSN0J3YR2Q.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1B6GHNCF7BMDFK118BEP-01KJ5G1B6GZPZX99R1KM440GA5.jpeg",
      options: [{ title: "Height", values: ["12 ft", "16 ft", "20 ft"] }],
      variants: [
        {
          title: "12 ft Racking",
          sku: "RACK-12",
          options: { Height: "12 ft" },
          manage_inventory: true,
          prices: [
            { amount: 1850, currency_code: "usd" },
            { amount: 1720, currency_code: "eur" },
          ],
        },
        {
          title: "16 ft Racking",
          sku: "RACK-16",
          options: { Height: "16 ft" },
          manage_inventory: true,
          prices: [
            { amount: 2450, currency_code: "usd" },
            { amount: 2280, currency_code: "eur" },
          ],
        },
        {
          title: "20 ft Racking",
          sku: "RACK-20",
          options: { Height: "20 ft" },
          manage_inventory: true,
          prices: [
            { amount: 3100, currency_code: "usd" },
            { amount: 2890, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Hydraulic Dock Leveler",
      handle: "hydraulic-dock-leveler",
      description:
        "Push-button hydraulic dock leveler for smooth truck-to-dock transitions. 25,000 lb capacity.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["warehouse-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1CE79GKT265PKNK2AA7F-01KJ5G1CE7Y7G6F15KQEWQFZ1P.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1H8ZFVEJAQ4SRDG8KXBM-01KJ5G1H8ZRFVPZYTNJ5Z74KE8.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1CE79GKT265PKNK2AA7F-01KJ5G1CE7Y7G6F15KQEWQFZ1P.jpeg",
      options: [{ title: "Width", values: ["6 ft", "7 ft"] }],
      variants: [
        {
          title: "6 ft Dock Leveler",
          sku: "DOCK-6",
          options: { Width: "6 ft" },
          manage_inventory: true,
          prices: [
            { amount: 4500, currency_code: "usd" },
            { amount: 4190, currency_code: "eur" },
          ],
        },
        {
          title: "7 ft Dock Leveler",
          sku: "DOCK-7",
          options: { Width: "7 ft" },
          manage_inventory: true,
          prices: [
            { amount: 5200, currency_code: "usd" },
            { amount: 4840, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Electric Pallet Jack",
      handle: "electric-pallet-jack",
      description:
        "Compact electric pallet jack built for efficient warehouse operations. Features intuitive controls, tight turning radius, and long-lasting battery for all-day performance.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["warehouse-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XCAFY5N8JR6QJWHT0DTN-01KJD5XCAFCKTQ4XF7Z45BYPWM.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBR8SK8CF76AJCPVHGR4RD-01KJEBR8SM44S3C60WACNC3R5T.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XCAFY5N8JR6QJWHT0DTN-01KJD5XCAFCKTQ4XF7Z45BYPWM.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Electric Pallet Jack",
          sku: "EPJ-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 2850, currency_code: "usd" },
            { amount: 2650, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Warehouse Platform Ladder",
      handle: "warehouse-platform-ladder",
      description:
        "Heavy-gauge steel platform ladder with slip-resistant treads and locking casters. Wide platform provides a stable, secure work surface. OSHA-compliant guardrails included.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["warehouse-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XJKFCEJSAYCF7EQX33TH-01KJD5XJKFGVDXA9GRVG3AGG14.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRA4EE9M07P2E4K8N8VCD-01KJEBRA4E57T20JWAC7TZF2A8.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XJKFCEJSAYCF7EQX33TH-01KJD5XJKFGVDXA9GRVG3AGG14.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Warehouse Platform Ladder",
          sku: "WPL-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 425, currency_code: "usd" },
            { amount: 395, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Industrial Shelving Unit",
      handle: "industrial-shelving-unit",
      description:
        "Modular heavy-duty shelving constructed from reinforced steel with a powder-coat finish for corrosion resistance. Adjustable shelf heights. Easy bolt-free assembly.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["warehouse-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XET1ESS7DRQ4HK124DKG-01KJD5XET1S525NGMGHCK95KX1.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRBN83G7DQDCGCTFM94PW-01KJEBRBN8QXZH4TRAC7SS57PS.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XET1ESS7DRQ4HK124DKG-01KJD5XET1S525NGMGHCK95KX1.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Industrial Shelving Unit",
          sku: "ISU-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 890, currency_code: "usd" },
            { amount: 830, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Loading Dock Bumper",
      handle: "loading-dock-bumper",
      description:
        "Molded rubber dock bumper engineered to absorb trailer impact and protect building structures. UV and weather resistant for long outdoor service life.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["warehouse-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XFQ6WM1F4NM1J3V1D14M-01KJD5XFQ6CTC7C7RSGT54XTSK.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRDA0GSAC92QYF5R4D3SB-01KJEBRDA0MHH6Q7D5XGJXEYK4.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XFQ6WM1F4NM1J3V1D14M-01KJD5XFQ6CTC7C7RSGT54XTSK.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Loading Dock Bumper",
          sku: "LDB-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 185, currency_code: "usd" },
            { amount: 170, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Dock Plate",
      handle: "dock-plate",
      description:
        "Aluminum dock plate designed to bridge the gap between dock and trailer. Diamond-tread surface provides traction for pallet jacks and carts. Beveled edges for smooth transitions.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["warehouse-equipment"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XG4NBG0J5K1B107KBS19-01KJD5XG4PWKDQCK76YPSJ1KZK.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRF0YMGMWRBY9XWN63JY4-01KJEBRF0ZZRVSEF57WP92FAGP.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XG4NBG0J5K1B107KBS19-01KJD5XG4PWKDQCK76YPSJ1KZK.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Dock Plate",
          sku: "DP-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 1250, currency_code: "usd" },
            { amount: 1165, currency_code: "eur" },
          ],
        },
      ],
    },
    // --- Material Handling ---
    {
      title: "Gravity Roller Conveyor",
      handle: "gravity-roller-conveyor",
      description:
        "Non-powered gravity roller conveyor for efficient material movement. Galvanized steel rollers.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["material-handling"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1SZ3CT142X1ZZR4FGE8N-01KJ5G1SZ3DPT3RJN8E1K4Q8S3.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1SYHHFXPAPFP8NK071F5-01KJ5G1SYH0NC04ADD04V1CZNY.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1SZ3CT142X1ZZR4FGE8N-01KJ5G1SZ3DPT3RJN8E1K4Q8S3.jpeg",
      options: [{ title: "Length", values: ["10 ft", "20 ft"] }],
      variants: [
        {
          title: "10 ft Section",
          sku: "CONV-10",
          options: { Length: "10 ft" },
          manage_inventory: true,
          prices: [
            { amount: 680, currency_code: "usd" },
            { amount: 630, currency_code: "eur" },
          ],
        },
        {
          title: "20 ft Section",
          sku: "CONV-20",
          options: { Length: "20 ft" },
          manage_inventory: true,
          prices: [
            { amount: 1250, currency_code: "usd" },
            { amount: 1165, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Manual Pallet Jack",
      handle: "manual-pallet-jack",
      description:
        "Industrial-grade hand pallet truck with 5,500 lb capacity. Hardened steel forks.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["material-handling"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1TZ0S4YS969SCNA1PSWV-01KJ5G1TZ03JV1B0KKPMS4QG04.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1W2BD9MFSS41KR0732Q1-01KJ5G1W2CPCSCV84FZ71E70AC.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G1TZ0S4YS969SCNA1PSWV-01KJ5G1TZ03JV1B0KKPMS4QG04.jpeg",
      options: [{ title: "Fork Length", values: ["27 inch", "48 inch"] }],
      variants: [
        {
          title: "27 inch Forks",
          sku: "PJACK-27",
          options: { "Fork Length": "27 inch" },
          manage_inventory: true,
          prices: [
            { amount: 340, currency_code: "usd" },
            { amount: 315, currency_code: "eur" },
          ],
        },
        {
          title: "48 inch Forks",
          sku: "PJACK-48",
          options: { "Fork Length": "48 inch" },
          manage_inventory: true,
          prices: [
            { amount: 395, currency_code: "usd" },
            { amount: 365, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Hand Truck",
      handle: "hand-truck",
      description:
        "Versatile two-wheel hand truck with a reinforced steel frame and pneumatic tires. Ergonomic handle and toe plate make quick work of moving boxes and heavy loads.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["material-handling"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XQRQ8Q5FNEMGPVCDW38H-01KJD5XQRQFYGD2YP55M5C2R66.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRG23VE98Y887CD67CF5Q-01KJEBRG230HTK4HR0FRZWDBQP.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XQRQ8Q5FNEMGPVCDW38H-01KJD5XQRQFYGD2YP55M5C2R66.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Hand Truck",
          sku: "HT-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 145, currency_code: "usd" },
            { amount: 135, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Platform Cart",
      handle: "platform-cart",
      description:
        "Flat-bed platform cart with four swivel casters for maximum maneuverability. Welded steel deck supports heavy, bulky loads. Non-marking wheels protect finished floors.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["material-handling"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XS5HV9GVMKEPCW468BCE-01KJD5XS5HEBYRFJS5MSDYA6FA.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRHZ8EG33NMC2901WTYAH-01KJEBRHZ8KG09184AYQJSZSG3.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XS5HV9GVMKEPCW468BCE-01KJD5XS5HEBYRFJS5MSDYA6FA.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Platform Cart",
          sku: "PC-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 295, currency_code: "usd" },
            { amount: 275, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Hydraulic Lift Table",
      handle: "hydraulic-lift-table",
      description:
        "Foot-pump hydraulic lift table that raises loads to ergonomic working height. Steel construction with safety overload valve and maintenance-free pump.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["material-handling"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XSX1PEKMWK5BDW2AAXW2-01KJD5XSX10YWG11VCA3VBRJP5.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRK9FKN9GPYB61XXYK86D-01KJEBRK9FWHZ6E15TGR091Z6P.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XSX1PEKMWK5BDW2AAXW2-01KJD5XSX10YWG11VCA3VBRJP5.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Hydraulic Lift Table",
          sku: "HLT-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 1650, currency_code: "usd" },
            { amount: 1540, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Drum Dolly",
      handle: "drum-dolly",
      description:
        "Low-profile drum dolly designed to transport 30- and 55-gallon steel or poly drums. Three swivel casters allow easy navigation in tight spaces.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["material-handling"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XTVTMGTZ57A3ESMGBCJD-01KJD5XTVTSXS69RJTFKVKX6NV.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRMGQ2W1FKBGCGV9Q1MRZ-01KJEBRMGQEY6XKX4HJ5Y603QF.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XTVTMGTZ57A3ESMGBCJD-01KJD5XTVTSXS69RJTFKVKX6NV.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Drum Dolly",
          sku: "DD-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 125, currency_code: "usd" },
            { amount: 115, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Tow Tractor",
      handle: "tow-tractor",
      description:
        "Electric tow tractor for moving heavy trailer trains through warehouses, factories, and airports. Variable-speed control, regenerative braking, and compact footprint.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["material-handling"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XW1F04DARE34NBR4ZNAY-01KJD5XW1FSAYQ2J1BHKDBP20E.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRQ3QW2RD52R8E9WQQMPN-01KJEBRQ3QAMCP6MMHM362V5G6.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5XW1F04DARE34NBR4ZNAY-01KJD5XW1FSAYQ2J1BHKDBP20E.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Tow Tractor",
          sku: "TT-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 8500, currency_code: "usd" },
            { amount: 7920, currency_code: "eur" },
          ],
        },
      ],
    },
    // --- Operator Accessories ---
    {
      title: "Ergonomic Operator Seat",
      handle: "ergonomic-operator-seat",
      description:
        "Premium suspension seat with full adjustability. Features lumbar support and armrests.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["operator-accessories"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G28ZVP0J9V5TWB21TQ79M-01KJ5G28ZV34TVRMM1H6PHEWA1.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G29SCCJRW6D8EYYN6E3JT-01KJ5G29SDK23RXX9NJ8Y78DAR.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G28ZVP0J9V5TWB21TQ79M-01KJ5G28ZV34TVRMM1H6PHEWA1.jpeg",
      options: [{ title: "Type", values: ["Standard", "Heated"] }],
      variants: [
        {
          title: "Standard Seat",
          sku: "SEAT-STD",
          options: { Type: "Standard" },
          manage_inventory: true,
          prices: [
            { amount: 285, currency_code: "usd" },
            { amount: 265, currency_code: "eur" },
          ],
        },
        {
          title: "Heated Seat",
          sku: "SEAT-HEAT",
          options: { Type: "Heated" },
          manage_inventory: true,
          prices: [
            { amount: 420, currency_code: "usd" },
            { amount: 390, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Industrial Work Gloves",
      handle: "industrial-work-gloves",
      description:
        "Heavy-duty work gloves with reinforced palm and fingertips. Synthetic leather construction.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["operator-accessories"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G2A9MA43X2K32SQNQGDDY-01KJ5G2A9MMWVR6XGMFV159Z5J.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G2BVFJZWZY27RW7BVKZPH-01KJ5G2BVFZ16GVRGVY51V1GG5.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G2A9MA43X2K32SQNQGDDY-01KJ5G2A9MMWVR6XGMFV159Z5J.jpeg",
      options: [{ title: "Size", values: ["Medium", "Large", "X-Large"] }],
      variants: [
        {
          title: "Medium",
          sku: "GLOVE-M",
          options: { Size: "Medium" },
          manage_inventory: true,
          prices: [
            { amount: 24, currency_code: "usd" },
            { amount: 22, currency_code: "eur" },
          ],
        },
        {
          title: "Large",
          sku: "GLOVE-L",
          options: { Size: "Large" },
          manage_inventory: true,
          prices: [
            { amount: 24, currency_code: "usd" },
            { amount: 22, currency_code: "eur" },
          ],
        },
        {
          title: "X-Large",
          sku: "GLOVE-XL",
          options: { Size: "X-Large" },
          manage_inventory: true,
          prices: [
            { amount: 26, currency_code: "usd" },
            { amount: 24, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Safety Hard Hat with Face Shield",
      handle: "safety-hard-hat",
      description:
        "OSHA-compliant hard hat with integrated face shield. Ratchet suspension for comfortable fit.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["operator-accessories"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G2P1CF88Y2C9AP4QDABRN-01KJ5G2P1CTFDMHAFQF0FPTRN6.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G2PQYC05RYH1BS15RSHFZ-01KJ5G2PQY0B5VCYSXQXGKEQ1H.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJ5G2P1CF88Y2C9AP4QDABRN-01KJ5G2P1CTFDMHAFQF0FPTRN6.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Safety Hard Hat",
          sku: "HARDHAT-01",
          options: { "Default option": "Default option value" },
          manage_inventory: true,
          prices: [
            { amount: 45, currency_code: "usd" },
            { amount: 42, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Forklift Suspension Seat",
      handle: "forklift-suspension-seat",
      description:
        "Full-suspension operator seat with adjustable lumbar support, armrests, and slide rails. Vinyl upholstery stands up to daily industrial use.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["operator-accessories"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y15YNTR1VQFN1W57FPED-01KJD5Y15Z606PPZ8STD1XQT3T.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRVZ6H9DG6V39H5DBESPS-01KJEBRVZ6D7R2ZKS4J1A88YTV.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y15YNTR1VQFN1W57FPED-01KJD5Y15Z606PPZ8STD1XQT3T.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Forklift Suspension Seat",
          sku: "FSS-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 520, currency_code: "usd" },
            { amount: 485, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Overhead Guard",
      handle: "overhead-guard",
      description:
        "Replacement overhead guard fabricated from structural steel tubing. Provides OSHA-compliant falling-object protection for the forklift operator.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["operator-accessories"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y1XR0QMQNV10VQD8CS5S-01KJD5Y1XRG24NSG9VRA9QN8PZ.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRYVKKNCEQAJA57F3SSJR-01KJEBRYVKHGDMD8NV8S4X4YXX.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y1XR0QMQNV10VQD8CS5S-01KJD5Y1XRG24NSG9VRA9QN8PZ.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Overhead Guard",
          sku: "OG-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 680, currency_code: "usd" },
            { amount: 635, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Rain Cover",
      handle: "rain-cover",
      description:
        "Clear vinyl rain cover that shields the forklift operator from wind, rain, and snow while maintaining full visibility. Zippered door for easy entry and exit.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["operator-accessories"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y7RAA1GRQ1YB3S51Q4E7-01KJD5Y7RANMMG9QZ5FVWFMGBJ.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBRZJG9E90QG38EAW7XVB2-01KJEBRZJG88NPKXF4335Y07XS.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y7RAA1GRQ1YB3S51Q4E7-01KJD5Y7RANMMG9QZ5FVWFMGBJ.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Rain Cover",
          sku: "RC-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 245, currency_code: "usd" },
            { amount: 230, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Operator Heater Kit",
      handle: "operator-heater-kit",
      description:
        "12/24V cab heater kit that delivers warm air to the operator station during cold-weather operation. Includes fan unit, ducting, and mounting hardware.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["operator-accessories"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y3G676A5C97H6NCTARB0-01KJD5Y3G6ZB40ZQHBAA309KHZ.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBS0Q7284MQG7109JQ96M0-01KJEBS0Q7Z9RZF4ECR2E4W9QT.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y3G676A5C97H6NCTARB0-01KJD5Y3G6ZB40ZQHBAA309KHZ.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Operator Heater Kit",
          sku: "OHK-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 195, currency_code: "usd" },
            { amount: 180, currency_code: "eur" },
          ],
        },
      ],
    },
    {
      title: "Forklift Fan Kit",
      handle: "forklift-fan-kit",
      description:
        "Clip-on oscillating fan for forklift cabs. Runs on the truck's electrical system. Quiet motor with adjustable speed settings.",
      status: "published" as const,
      shipping_profile_id: shippingProfile.id,
      categories: [{ id: catMap["operator-accessories"] }],
      images: [
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y4ACRGCJVFZCYNET37D7-01KJD5Y4AC696YR1FJ86984MRZ.jpeg",
        },
        {
          url: "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJEBS2904V1JYVFWV4W2QZMB-01KJEBS290NY7Y233AFRD2.jpeg",
        },
      ],
      thumbnail:
        "https://cdn.mignite.app/ws/works_01KHVWQKQ0BABM5CB7CRHVC43N/generated-01KJD5Y4ACRGCJVFZCYNET37D7-01KJD5Y4AC696YR1FJ86984MRZ.jpeg",
      options: [{ title: "Default option", values: ["Default option value"] }],
      variants: [
        {
          title: "Forklift Fan Kit",
          sku: "FFK-001",
          options: { "Default option": "Default option value" },
          manage_inventory: false,
          prices: [
            { amount: 165, currency_code: "usd" },
            { amount: 155, currency_code: "eur" },
          ],
        },
      ],
    },
  ];

  const newProducts = productsToCreate.filter(
    (p) => !existingHandles.includes(p.handle)
  );

  if (newProducts.length > 0) {
    logger.info("Seeding products...");

    // ─── Global Product Options ──────────────────────────────────────
    // Collect the union of values per option title across all products
    // and create a single global option per title. Each product will then
    // reference the global option(s) and the subset of value IDs it uses.
    const titleToValues: Record<string, Set<string>> = {};
    for (const product of newProducts) {
      const inlineOptions = (product as any).options as
        | Array<{ title: string; values: string[] }>
        | undefined;
      if (!inlineOptions) continue;
      for (const opt of inlineOptions) {
        if (!titleToValues[opt.title]) {
          titleToValues[opt.title] = new Set();
        }
        for (const v of opt.values) {
          titleToValues[opt.title].add(v);
        }
      }
    }

    const globalOptionInputs = Object.entries(titleToValues).map(
      ([title, values]) => ({
        title,
        values: Array.from(values),
      })
    );

    logger.info(
      `Creating ${globalOptionInputs.length} global product options...`
    );

    const { result: createdGlobalOptions } = await createProductOptionsWorkflow(
      container
    ).run({
      input: {
        product_options: globalOptionInputs,
      },
    });

    // Build a lookup: title -> { id, valueMap: { value -> value_id } }
    const optionLookup: Record<
      string,
      { id: string; valueMap: Record<string, string> }
    > = {};
    for (const opt of createdGlobalOptions as Array<{
      id: string;
      title: string;
      values?: Array<{ id: string; value: string }>;
    }>) {
      const valueMap: Record<string, string> = {};
      for (const v of opt.values ?? []) {
        valueMap[v.value] = v.id;
      }
      optionLookup[opt.title] = { id: opt.id, valueMap };
    }

    // Replace each product's inline options with references to the
    // global options + the specific value_ids that product uses.
    const productsWithGlobalOptions = newProducts.map((product) => {
      const inlineOptions = (product as any).options as
        | Array<{ title: string; values: string[] }>
        | undefined;
      if (!inlineOptions) return product;

      const linkedOptions = inlineOptions.map((opt) => {
        const lookup = optionLookup[opt.title];
        if (!lookup) {
          throw new Error(
            `Global option not found for title "${opt.title}"`
          );
        }
        return {
          id: lookup.id,
          value_ids: opt.values
            .map((v) => lookup.valueMap[v])
            .filter(Boolean),
        };
      });

      return {
        ...product,
        options: linkedOptions,
      };
    });

    const { result: createdProducts } = await createProductsWorkflow(
      container
    ).run({
      input: {
        products: productsWithGlobalOptions as any,
      },
    });

    // Link products to sales channel
    await linkProductsToSalesChannelWorkflow(container).run({
      input: {
        id: defaultSalesChannel[0].id,
        add: createdProducts.map((p) => p.id),
      },
    });

    logger.info(`Created ${createdProducts.length} products.`);

    // ─── Inventory Levels ────────────────────────────────────────────
    // Inventory items are auto-created for variants with manage_inventory: true.
    // We just need to create inventory levels at the stock location.
    logger.info("Setting up inventory levels...");

    const { data: variantsWithInventory } = await query.graph({
      entity: "product_variant",
      fields: ["id", "manage_inventory", "inventory_items.inventory_item_id"],
      filters: { product_id: createdProducts.map((p) => p.id) },
    });

    const inventoryItemIds = variantsWithInventory
      .filter((v: any) => v.manage_inventory)
      .flatMap(
        (v: any) =>
          v.inventory_items?.map((i: any) => i.inventory_item_id) ?? []
      );

    if (inventoryItemIds.length > 0) {
      const inventoryLevels = inventoryItemIds.map(
        (inventoryItemId: string) => ({
          inventory_item_id: inventoryItemId,
          location_id: stockLocation.id,
          stocked_quantity: 100,
        })
      );

      await createInventoryLevelsWorkflow(container).run({
        input: { inventory_levels: inventoryLevels },
      });

      logger.info(
        `Created ${inventoryLevels.length} inventory levels with 100 stock each.`
      );
    }
  } else {
    logger.info("Products already exist, skipping.");
  }

  logger.info("Seeding complete!");
}

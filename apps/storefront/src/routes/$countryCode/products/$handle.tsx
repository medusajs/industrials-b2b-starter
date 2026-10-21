import { listProducts, retrieveProduct } from "@/lib/data/products";
import { getRegion } from "@/lib/data/regions";
import { queryKeys } from "@/lib/utils/query-keys";
import { sanitize } from "@/lib/utils/sanitize";
import { isVariantInStock } from "@/lib/utils/product";
import { getStorefrontUrl, STORE_NAME } from "@/lib/utils/site";
import {
  buildReturnPolicy,
  buildShippingDetails,
  getRegionPolicies,
} from "@/lib/utils/store-policies";
import ProductDetails from "@/pages/product";
import { HttpTypes } from "@medusajs/types";
import { createFileRoute, notFound } from "@tanstack/react-router";

export const Route = createFileRoute("/$countryCode/products/$handle")({
  loader: async ({ params, context }) => {
    const { countryCode, handle } = params;
    const { queryClient } = context;

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    });

    if (!region || !handle) {
      throw notFound();
    }

    // Single comprehensive product fetch with all needed fields
    const product = await queryClient.ensureQueryData({
      queryKey: ["product", handle, region.id],
      queryFn: async () => {
        try {
          return await retrieveProduct({
            handle,
            region_id: region.id,
            fields:
              "*variants, *variants.options, +variants.inventory_quantity, +variants.manage_inventory, +variants.allow_backorder, +variants.calculated_price, *images, *options, *options.values, *collection, *tags",
          });
        } catch {
          throw notFound();
        }
      },
    });

    // Ensure related products are loaded for SSR to prevent hydration mismatch
    // This ensures consistent rendering between server and client
    await queryClient.ensureQueryData({
      queryKey: queryKeys.products.related(product.id, region.id),
      queryFn: async () => {
        const params: HttpTypes.StoreProductListParams = {
          fields: "title, handle, *thumbnail, *variants",
          is_giftcard: false,
          limit: 4,
        };

        if (product.collection_id) {
          params.collection_id = [product.collection_id];
        }

        if (product.tags && product.tags.length > 0) {
          params.tag_id = product.tags.map((tag) => tag.id);
        }

        const { products } = await listProducts({
          query_params: params,
          region_id: region.id,
        });

        return products.filter((p) => p.id !== product.id);
      },
    });

    return sanitize({
      countryCode,
      region,
      product: product as HttpTypes.StoreProduct,
    });
  },
  head: ({ loaderData }) => {
    const { product, countryCode, region } = loaderData || {};

    if (!product) {
      return {
        meta: [
          {
            title: "Product Not Found | ProLift Equipment",
          },
        ],
      };
    }

    const storefrontUrl = getStorefrontUrl()
    const productUrl = `${storefrontUrl}/${countryCode}/products/${product.handle}`
    const variants = product.variants ?? []
    const toAvailability = (inStock: boolean) =>
      inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    const productInStock = variants.some(isVariantInStock)
    const policies = getRegionPolicies(region)
    const images = product.images?.map((img: { url?: string }) => img.url).filter(Boolean) || []

    // Prices are shown only after sign-in, so offers intentionally carry no price.
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ProductGroup",
      name: product.title,
      description: product.description,
      image: images.length ? images : product.thumbnail,
      url: productUrl,
      productGroupID: product.id,
      brand: {
        "@type": "Brand",
        name: (product.metadata?.brand as string) || STORE_NAME,
      },
      hasVariant: variants.map((variant: HttpTypes.StoreProductVariant) => ({
        "@type": "Product",
        name: variant.title ? `${product.title} - ${variant.title}` : product.title,
        sku: variant.sku || undefined,
        image: images[0] || product.thumbnail,
        additionalProperty: variant.options
          ?.map((option) => ({
            "@type": "PropertyValue",
            name: product.options?.find((o: HttpTypes.StoreProductOption) => o.id === option.option_id)?.title,
            value: option.value,
          }))
          .filter((property) => property.name !== "Default option"),
        offers: {
          "@type": "Offer",
          url: productUrl,
          sku: variant.sku || undefined,
          availability: toAvailability(isVariantInStock(variant)),
          itemCondition: "https://schema.org/NewCondition",
          ...(policies && {
            shippingDetails: buildShippingDetails(policies, countryCode, region.currency_code),
            hasMerchantReturnPolicy: buildReturnPolicy(policies, countryCode),
          }),
        },
      })),
    };

    // Get first product image for preloading (critical for LCP)
    const firstImageUrl = product.images?.[0]?.url || product.thumbnail;

    return {
      meta: [
        {
          title: `${product.title} | ProLift Equipment`,
        },
        {
          name: "description",
          content: product.description || "Product details",
        },
        {
          property: "og:title",
          content: `${product.title} | ProLift Equipment`,
        },
        {
          property: "og:description",
          content:
            product.description || "Check out this product on ProLift Equipment",
        },
        {
          property: "og:image",
          content: product.thumbnail || "",
        },
        { property: "og:url", content: productUrl },
        { property: "og:type", content: "product" },
        {
          property: "product:availability",
          content: productInStock ? "in stock" : "out of stock",
        },
      ],
      links: [
        { rel: "canonical", href: productUrl },
        ...(firstImageUrl
          ? [
              {
                rel: "preload",
                href: firstImageUrl,
                as: "image",
                fetchPriority: "high" as const,
              },
            ]
          : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structuredData),
        },
      ],
    };
  },
  component: ProductDetails,
});

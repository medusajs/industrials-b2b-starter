import { HttpTypes } from "@medusajs/framework/types";
import { Plus, XMark } from "@medusajs/icons";
import {
  Badge,
  Button,
  Drawer,
  Heading,
  IconButton,
  Input,
  Text,
  toast,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Thumbnail } from "../../../../components/common";
import { useAddItemsToQuote } from "../../../../hooks/api";
import { sdk } from "../../../../lib/client";
import { formatAmount } from "../../../../utils";

type AddItemsDrawerProps = {
  orderId: string;
  currencyCode: string;
  regionId?: string;
};

type SelectedItem = {
  variant_id: string;
  quantity: number;
  variant: HttpTypes.AdminProductVariant;
  product: HttpTypes.AdminProduct;
};

export const AddItemsDrawer = ({
  orderId,
  currencyCode,
  regionId,
}: AddItemsDrawerProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

  const { mutateAsync: addItems, isPending } = useAddItemsToQuote(orderId);

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["products", searchTerm],
    queryFn: () =>
      sdk.admin.product.list({
        q: searchTerm || undefined,
        limit: 20,
        fields:
          "id,title,thumbnail,variants.id,variants.title,variants.sku,variants.prices.*",
      }),
    enabled: open,
  });

  const products = productsData?.products || [];

  const handleAddVariant = useCallback(
    (product: HttpTypes.AdminProduct, variant: HttpTypes.AdminProductVariant) => {
      setSelectedItems((prev) => {
        const existing = prev.find((i) => i.variant_id === variant.id);
        if (existing) {
          return prev.map((i) =>
            i.variant_id === variant.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        }
        return [...prev, { variant_id: variant.id, quantity: 1, variant, product }];
      });
    },
    []
  );

  const handleRemoveVariant = useCallback((variantId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.variant_id !== variantId));
  }, []);

  const handleUpdateQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (quantity <= 0) {
        handleRemoveVariant(variantId);
        return;
      }
      setSelectedItems((prev) =>
        prev.map((i) => (i.variant_id === variantId ? { ...i, quantity } : i))
      );
    },
    [handleRemoveVariant]
  );

  const handleSubmit = async () => {
    if (selectedItems.length === 0) return;

    try {
      await addItems({
        items: selectedItems.map((item) => ({
          variant_id: item.variant_id,
          quantity: item.quantity,
        })),
      });
      toast.success(t("general.success"), {
        description: `Added ${selectedItems.length} item(s) to quote`,
      });
      setSelectedItems([]);
      setOpen(false);
    } catch (e: any) {
      toast.error(t("general.error"), {
        description: e.message,
      });
    }
  };

  const getVariantPrice = useCallback(
    (variant: HttpTypes.AdminProductVariant) => {
      const price = variant.prices?.find(
        (p) => p.currency_code === currencyCode
      );
      return price?.amount ?? 0;
    },
    [currencyCode]
  );

  const totalAmount = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const price = getVariantPrice(item.variant);
      return acc + price * item.quantity;
    }, 0);
  }, [selectedItems, getVariantPrice]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Trigger asChild>
        <Button variant="secondary" size="small">
          <Plus className="mr-2" />
          {t("actions.add")} {t("fields.items")}
        </Button>
      </Drawer.Trigger>

      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Add Items to Quote</Drawer.Title>
        </Drawer.Header>

        <Drawer.Body className="flex flex-col gap-4 overflow-hidden">
          {/* Search */}
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products..."
            autoComplete="off"
            type="search"
          />

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="border-ui-border-base rounded-lg border p-3">
              <Heading level="h3" className="txt-small mb-2 font-medium">
                Selected Items ({selectedItems.length})
              </Heading>
              <div className="flex max-h-[200px] flex-col gap-2 overflow-y-auto">
                {selectedItems.map((item) => (
                  <div
                    key={item.variant_id}
                    className="bg-ui-bg-subtle flex items-center justify-between rounded-lg p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Thumbnail src={item.product.thumbnail} />
                      <div className="flex flex-col">
                        <Text className="txt-small" weight="plus">
                          {item.product.title}
                        </Text>
                        <Text className="txt-small text-ui-fg-subtle">
                          {item.variant.title}
                        </Text>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateQuantity(
                            item.variant_id,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-16"
                      />
                      <IconButton
                        variant="transparent"
                        size="small"
                        onClick={() => handleRemoveVariant(item.variant_id)}
                      >
                        <XMark />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t pt-2">
                <Text className="txt-small text-ui-fg-subtle">Total</Text>
                <Text className="txt-small" weight="plus">
                  {formatAmount(totalAmount, currencyCode)}
                </Text>
              </div>
            </div>
          )}

          {/* Product List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Text className="text-ui-fg-muted">Loading products...</Text>
              </div>
            ) : products.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Text className="text-ui-fg-muted">No products found</Text>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border-ui-border-base rounded-lg border"
                  >
                    <div className="flex items-center gap-3 p-3">
                      <Thumbnail src={product.thumbnail} />
                      <div className="flex-1">
                        <Text className="txt-small" weight="plus">
                          {product.title}
                        </Text>
                        <Text className="txt-small text-ui-fg-subtle">
                          {product.variants?.length || 0} variant(s)
                        </Text>
                      </div>
                    </div>

                    {product.variants && product.variants.length > 0 && (
                      <div className="border-ui-border-base border-t">
                        {product.variants.map((variant) => {
                          const isSelected = selectedItems.some(
                            (i) => i.variant_id === variant.id
                          );
                          const price = getVariantPrice(variant);

                          return (
                            <div
                              key={variant.id}
                              className="hover:bg-ui-bg-subtle flex items-center justify-between px-3 py-2"
                            >
                              <div className="flex flex-col">
                                <Text className="txt-small">
                                  {variant.title}
                                </Text>
                                {variant.sku && (
                                  <Text className="txt-small text-ui-fg-subtle">
                                    SKU: {variant.sku}
                                  </Text>
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <Text className="txt-small">
                                  {formatAmount(price, currencyCode)}
                                </Text>
                                {isSelected ? (
                                  <Badge color="green" size="2xsmall">
                                    Added
                                  </Badge>
                                ) : (
                                  <IconButton
                                    variant="transparent"
                                    size="small"
                                    onClick={() =>
                                      handleAddVariant(product, variant)
                                    }
                                  >
                                    <Plus />
                                  </IconButton>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Drawer.Body>

        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">{t("actions.cancel")}</Button>
          </Drawer.Close>
          <Button
            onClick={handleSubmit}
            disabled={selectedItems.length === 0 || isPending}
            isLoading={isPending}
          >
            Add {selectedItems.length} Item(s)
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};

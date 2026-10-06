import {
  AdminOrder,
  AdminOrderLineItem,
  AdminOrderPreview,
} from "@medusajs/framework/types";
import { Heading, Input } from "@medusajs/ui";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddItemsDrawer } from "./add-items-drawer";
import { ManageItem } from "./manage-item";

type ManageItemsSectionProps = {
  order: AdminOrder;
  preview: AdminOrderPreview;
};

export const ManageItemsSection = ({
  order,
  preview,
}: ManageItemsSectionProps) => {
  const { t } = useTranslation();
  const [filterTerm, setFilterTerm] = useState("");

  const filteredItems = useMemo(() => {
    return preview.items.filter(
      (i) =>
        i.title.toLowerCase().includes(filterTerm) ||
        i.product_title?.toLowerCase().includes(filterTerm)
    ) as AdminOrderLineItem[];
  }, [preview, filterTerm]);

  const originalItemsMap = useMemo(() => {
    return new Map(order.items.map((item) => [item.id, item]));
  }, [order, filterTerm]);

  return (
    <div>
      <div className="mb-3 mt-8 flex items-center justify-between">
        <Heading level="h2">{t("fields.items")}</Heading>

        <div className="flex items-center gap-2">
          <Input
            value={filterTerm}
            onChange={(e) => setFilterTerm(e.target.value)}
            placeholder={t("fields.search")}
            autoComplete="off"
            type="search"
          />
          <AddItemsDrawer
            orderId={order.id}
            currencyCode={order.currency_code}
            regionId={order.region_id ?? undefined}
          />
        </div>
      </div>

      {filteredItems.map((item) => (
        <ManageItem
          key={item.id}
          originalItem={originalItemsMap.get(item.id)!}
          item={item}
          orderId={order.id}
          currencyCode={order.currency_code}
        />
      ))}

      {filterTerm && !filteredItems.length && (
        <div
          style={{
            background:
              "repeating-linear-gradient(-45deg, rgb(212, 212, 216, 0.15), rgb(212, 212, 216,.15) 10px, transparent 10px, transparent 20px)",
          }}
          className="bg-ui-bg-field mt-4 block h-[56px] w-full rounded-lg border border-dashed"
        />
      )}
    </div>
  );
};

import {
  AdminCustomer,
  AdminOrder,
  AdminOrderPreview,
  AdminUser,
  BaseFilterable,
  FindParams,
  PaginatedResponse,
  StoreCart,
} from "@medusajs/framework/types";

/* Module Entity: Quote */

export type ModuleQuote = {
  id: string;
  status: string;
  draft_order_id: string;
  order_change_id: string;
  cart_id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
};

export type ModuleCreateQuote = {
  draft_order_id: string;
  order_change_id: string;
  cart_id: string;
  customer_id: string;
};

export type ModuleUpdateQuote = {
  id: string;
  status?: string;
};

/* Module Entity: Message */

export type ModuleCreateQuoteMessage = {
  text: string;
  quote_id: string;
  admin_id?: string;
  customer_id?: string;
  item_id?: string | null;
};

export type ModuleQuoteMessage = {
  id: string;
  text: string;
  quote_id: string;
  admin_id: string;
  customer_id: string;
  item_id: string;
};

/* Query Types */

export type QueryEmployee = {
  id: string;
  spending_limit: number;
  company_id: string;
  company?: {
    id: string;
    name: string;
    currency_code?: string;
  };
};

export type QueryQuoteMessage = ModuleQuoteMessage & {
  customer: AdminCustomer;
  admin: AdminUser;
};

export type QueryQuote = ModuleQuote & {
  draft_order: AdminOrder;
  cart: StoreCart;
  customer: AdminCustomer & {
    employee: QueryEmployee;
  };
  messages: QueryQuoteMessage[];
};

/* Service Types */

export interface ModuleQuoteFilters extends BaseFilterable<ModuleQuoteFilters> {
  q?: string;
  id?: string | string[];
  status?: string | string[];
}

/* HTTP Types */

export interface QuoteFilterParams extends FindParams, ModuleQuoteFilters {}

/* Admin */
export type AdminQuoteResponse = {
  quote: QueryQuote;
};

export type AdminQuotesResponse = PaginatedResponse<{
  quotes: QueryQuote[];
}>;

export type AdminCreateQuoteMessage = {
  text?: string;
  item_id?: string | null;
};

/* Store */

export type StoreQuoteResponse = {
  quote: QueryQuote;
};

export type StoreQuotesResponse = PaginatedResponse<{
  quotes: QueryQuote[];
}>;

export type StoreQuotePreviewResponse = {
  quote: QueryQuote & {
    order_preview: AdminOrderPreview;
  };
};

export type StoreCreateQuote = {
  cart_id: string;
};

export type StoreCreateQuoteMessage = {
  text: string;
  item_id?: string;
};

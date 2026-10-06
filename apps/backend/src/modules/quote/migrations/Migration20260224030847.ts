import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260224030847 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "quote" ("id" text not null, "status" text check ("status" in ('pending_merchant', 'pending_customer', 'accepted', 'customer_rejected', 'merchant_rejected')) not null default 'pending_merchant', "customer_id" text not null, "draft_order_id" text not null, "order_change_id" text not null, "cart_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "quote_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_quote_deleted_at" ON "quote" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "quote" cascade;`);
  }

}

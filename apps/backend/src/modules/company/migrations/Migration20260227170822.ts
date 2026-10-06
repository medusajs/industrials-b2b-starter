import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260227170822 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "company_address" add column if not exists "is_billing_only" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "company_address" drop column if exists "is_billing_only";`);
  }

}

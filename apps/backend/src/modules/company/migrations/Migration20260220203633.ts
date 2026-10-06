import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260220203633 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "company" add column if not exists "spend_limit_reset_frequency" text check ("spend_limit_reset_frequency" in ('none', 'daily', 'weekly', 'monthly', 'yearly')) not null default 'none';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "company" drop column if exists "spend_limit_reset_frequency";`);
  }

}

import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260212203026 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "company" drop constraint if exists "company_email_unique";`);
    this.addSql(`create table if not exists "company" ("id" text not null, "name" text not null, "email" text not null, "phone" text null, "address" text null, "city" text null, "state" text null, "postal_code" text null, "country_code" text null, "logo_url" text null, "status" text check ("status" in ('pending', 'active', 'inactive', 'suspended')) not null default 'pending', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "company_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_company_email_unique" ON "company" ("email") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_company_deleted_at" ON "company" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "employee" ("id" text not null, "is_admin" boolean not null default false, "spending_limit" numeric null, "company_id" text not null, "raw_spending_limit" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "employee_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_employee_company_id" ON "employee" ("company_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_employee_deleted_at" ON "employee" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "employee" add constraint "employee_company_id_foreign" foreign key ("company_id") references "company" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "employee" drop constraint if exists "employee_company_id_foreign";`);

    this.addSql(`drop table if exists "company" cascade;`);

    this.addSql(`drop table if exists "employee" cascade;`);
  }

}

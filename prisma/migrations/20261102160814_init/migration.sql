-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "StockReason" AS ENUM ('IMPORT', 'ORDER', 'ORDER_CANCELLED', 'RETURN', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH_ON_DELIVERY', 'BANK_TRANSFER', 'CARD');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('PREDRACUN', 'RACUN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMINISTRATOR', 'UREDNIK');

-- CreateTable
CREATE TABLE "category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" INTEGER,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "category_id" INTEGER,
    "brand_id" INTEGER,
    "colour_family" TEXT,
    "medium" TEXT,
    "series" TEXT,
    "pigment_code" TEXT,
    "single_pigment" BOOLEAN,
    "lightfastness" TEXT,
    "opacity" TEXT,
    "binder" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variant" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "size" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "stock_qty" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_cost" (
    "variant_id" INTEGER NOT NULL,
    "purchase_usd" DECIMAL(12,4),
    "purchase_km" DECIMAL(12,4),
    "margin" DECIMAL(6,2),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_cost_pkey" PRIMARY KEY ("variant_id")
);

-- CreateTable
CREATE TABLE "product_photo" (
    "id" SERIAL NOT NULL,
    "product_id" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "alt" TEXT,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movement" (
    "id" SERIAL NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "StockReason" NOT NULL,
    "order_id" INTEGER,
    "note" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_rate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "free_from" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "delivery_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "checkout_key" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "customer_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "customer_note" TEXT,
    "delivery_rate_id" INTEGER,
    "delivery_name" TEXT NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "delivery_price" DECIMAL(12,2) NOT NULL,
    "tax_total" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_line" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "variant_id" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" TEXT,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "qty" INTEGER NOT NULL,
    "line_total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_event" (
    "id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "from_status" "OrderStatus",
    "to_status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "user_id" TEXT,
    "user_name" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document" (
    "id" SERIAL NOT NULL,
    "type" "DocumentType" NOT NULL,
    "number" TEXT NOT NULL,
    "order_id" INTEGER NOT NULL,
    "storage_key" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "number_counter" (
    "series" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "number_counter_pkey" PRIMARY KEY ("series","year")
);

-- CreateTable
CREATE TABLE "article" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "cover_key" TEXT,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "setting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT,
    "user_name" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "record_id" TEXT,
    "summary" TEXT,
    "changes" JSONB,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_counter" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_counter_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'UREDNIK',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "failed_logins" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "last_request" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "category_slug_key" ON "category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brand_slug_key" ON "brand"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "brand_name_key" ON "brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "product_slug_key" ON "product"("slug");

-- CreateIndex
CREATE INDEX "product_status_idx" ON "product"("status");

-- CreateIndex
CREATE INDEX "product_category_id_idx" ON "product"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_variant_sku_key" ON "product_variant"("sku");

-- CreateIndex
CREATE INDEX "product_variant_product_id_idx" ON "product_variant"("product_id");

-- CreateIndex
CREATE INDEX "product_photo_product_id_sort_idx" ON "product_photo"("product_id", "sort");

-- CreateIndex
CREATE INDEX "stock_movement_variant_id_at_idx" ON "stock_movement"("variant_id", "at");

-- CreateIndex
CREATE UNIQUE INDEX "order_number_key" ON "order"("number");

-- CreateIndex
CREATE UNIQUE INDEX "order_checkout_key_key" ON "order"("checkout_key");

-- CreateIndex
CREATE INDEX "order_status_created_at_idx" ON "order"("status", "created_at");

-- CreateIndex
CREATE INDEX "order_email_idx" ON "order"("email");

-- CreateIndex
CREATE INDEX "order_line_order_id_idx" ON "order_line"("order_id");

-- CreateIndex
CREATE INDEX "order_event_order_id_at_idx" ON "order_event"("order_id", "at");

-- CreateIndex
CREATE UNIQUE INDEX "document_type_number_key" ON "document"("type", "number");

-- CreateIndex
CREATE UNIQUE INDEX "article_slug_key" ON "article"("slug");

-- CreateIndex
CREATE INDEX "article_published_at_idx" ON "article"("published_at");

-- CreateIndex
CREATE INDEX "audit_log_table_name_record_id_idx" ON "audit_log"("table_name", "record_id");

-- CreateIndex
CREATE INDEX "audit_log_at_idx" ON "audit_log"("at");

-- CreateIndex
CREATE INDEX "audit_log_user_id_idx" ON "audit_log"("user_id");

-- CreateIndex
CREATE INDEX "rate_counter_window_start_idx" ON "rate_counter"("window_start");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- AddForeignKey
ALTER TABLE "category" ADD CONSTRAINT "category_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_cost" ADD CONSTRAINT "variant_cost_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_photo" ADD CONSTRAINT "product_photo_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movement" ADD CONSTRAINT "stock_movement_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_delivery_rate_id_fkey" FOREIGN KEY ("delivery_rate_id") REFERENCES "delivery_rate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line" ADD CONSTRAINT "order_line_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_event" ADD CONSTRAINT "order_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "document_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Stock can never go below zero, even with two orders at the same moment.
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_stock_not_negative" CHECK ("stock_qty" >= 0);

-- Audit log: append-only (no UPDATE, no DELETE, not even for admins).
CREATE FUNCTION audit_log_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- ON DELETE SET NULL from "user" is allowed (only user_id changes).
  IF TG_OP = 'UPDATE'
     AND NEW.id = OLD.id AND NEW.at = OLD.at AND NEW.action = OLD.action
     AND NEW.table_name = OLD.table_name AND NEW.record_id IS NOT DISTINCT FROM OLD.record_id
     AND NEW.summary IS NOT DISTINCT FROM OLD.summary AND NEW.changes IS NOT DISTINCT FROM OLD.changes
     AND NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'audit_log is append-only';
END $$;

CREATE TRIGGER audit_log_no_change BEFORE UPDATE OR DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_append_only();

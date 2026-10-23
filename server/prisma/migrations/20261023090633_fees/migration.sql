-- CreateTable
CREATE TABLE "fee_head" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "term_months" TEXT[],
    "discountable" BOOLEAN NOT NULL,

    CONSTRAINT "fee_head_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_plan" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "amounts" JSONB NOT NULL,

    CONSTRAINT "fee_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "concession" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percent" INTEGER NOT NULL,

    CONSTRAINT "concession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_voucher" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "voucher_number" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE NOT NULL,
    "lines" JSONB NOT NULL,
    "discount" INTEGER NOT NULL,
    "total_amount" INTEGER NOT NULL,
    "paid_amount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'unpaid',
    "cancelled" JSONB,

    CONSTRAINT "fee_voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "receipt_no" TEXT NOT NULL,
    "voucher_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "late_fine" INTEGER NOT NULL DEFAULT 0,
    "method" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "by" TEXT NOT NULL,
    "reversed" JSONB,
    "idempotency_key" TEXT,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "day_closing" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "totals" JSONB NOT NULL,
    "cash_counted" INTEGER NOT NULL,
    "note" TEXT,
    "closed_at" TIMESTAMP(3) NOT NULL,
    "closed_by" TEXT NOT NULL,

    CONSTRAINT "day_closing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_reminder" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "by" TEXT NOT NULL,

    CONSTRAINT "fee_reminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_tenant_id_idempotency_key_key" ON "payment"("tenant_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "day_closing_tenant_id_branch_id_date_key" ON "day_closing"("tenant_id", "branch_id", "date");

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_voucher_id_fkey" FOREIGN KEY ("voucher_id") REFERENCES "fee_voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Row-level security: same pattern as prisma/migrations/20261021140000_rls.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['fee_head','fee_plan','concession','fee_voucher','payment','day_closing','fee_reminder']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_user', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t);
  END LOOP;
END $$;

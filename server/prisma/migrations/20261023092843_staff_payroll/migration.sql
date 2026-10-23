-- CreateTable
CREATE TABLE "staff_member" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "join_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "branch_id" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "cnic" TEXT,
    "address" TEXT,
    "qualification" TEXT,
    "employment" TEXT NOT NULL,
    "teaches" BOOLEAN NOT NULL,
    "basic_salary" INTEGER NOT NULL,
    "allowances" JSONB NOT NULL,
    "bank_account" TEXT,
    "left" JSONB,

    CONSTRAINT "staff_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_allocation" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "weekly_periods" INTEGER NOT NULL,

    CONSTRAINT "teacher_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advance" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "monthly_recovery" INTEGER NOT NULL,
    "recovered" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "advance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_run" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,
    "finalised_at" TIMESTAMP(3),

    CONSTRAINT "payroll_run_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payslip" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "basic" INTEGER NOT NULL,
    "allowances" JSONB NOT NULL,
    "adjustments" JSONB NOT NULL,
    "absent_days" INTEGER NOT NULL,
    "absent_deduction" INTEGER NOT NULL,
    "advance_recovery" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "eobi" INTEGER NOT NULL,
    "gross" INTEGER NOT NULL,
    "total_deductions" INTEGER NOT NULL,
    "net" INTEGER NOT NULL,
    "periods_per_week" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paid_at" TIMESTAMP(3),
    "method" TEXT,

    CONSTRAINT "payslip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teacher_allocation_tenant_id_section_id_subject_id_key" ON "teacher_allocation"("tenant_id", "section_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_run_tenant_id_branch_id_month_key" ON "payroll_run"("tenant_id", "branch_id", "month");

-- AddForeignKey
ALTER TABLE "payslip" ADD CONSTRAINT "payslip_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "payroll_run"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security: same pattern as prisma/migrations/20261021140000_rls.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['staff_member','teacher_allocation','advance','payroll_run','payslip']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_user', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t);
  END LOOP;
END $$;

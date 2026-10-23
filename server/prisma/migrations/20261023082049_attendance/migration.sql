-- CreateTable
CREATE TABLE "attendance_register" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "subject_id" TEXT,
    "marks" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3),
    "locked_by" TEXT,
    "reopened" JSONB,
    "alerts_sent_at" TIMESTAMP(3),
    "changes" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "attendance_register_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unlock_request" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "register_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "decided_by" TEXT,
    "decided_at" TIMESTAMP(3),

    CONSTRAINT "unlock_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_attendance_day" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "marks" JSONB NOT NULL,
    "saved_at" TIMESTAMP(3) NOT NULL,
    "saved_by" TEXT NOT NULL,

    CONSTRAINT "staff_attendance_day_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "unlock_request" ADD CONSTRAINT "unlock_request_register_id_fkey" FOREIGN KEY ("register_id") REFERENCES "attendance_register"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security: same pattern as prisma/migrations/20261021140000_rls.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['attendance_register','unlock_request','staff_attendance_day']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_user', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t);
  END LOOP;
END $$;

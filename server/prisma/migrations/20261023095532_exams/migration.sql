-- CreateTable
CREATE TABLE "exam" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "term_type" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "class_ids" TEXT[],
    "published_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,

    CONSTRAINT "exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_paper" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "pass_marks" INTEGER NOT NULL,

    CONSTRAINT "exam_paper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_mark" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "obtained" DOUBLE PRECISION,
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "remark" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" TEXT NOT NULL,

    CONSTRAINT "exam_mark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "exam_tenant_id_branch_id_title_key" ON "exam"("tenant_id", "branch_id", "title");

-- CreateIndex
CREATE UNIQUE INDEX "exam_paper_tenant_id_exam_id_class_id_subject_id_key" ON "exam_paper"("tenant_id", "exam_id", "class_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_mark_tenant_id_exam_id_subject_id_student_id_key" ON "exam_mark"("tenant_id", "exam_id", "subject_id", "student_id");

-- AddForeignKey
ALTER TABLE "exam_paper" ADD CONSTRAINT "exam_paper_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_mark" ADD CONSTRAINT "exam_mark_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security: same pattern as prisma/migrations/20261021140000_rls.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['exam','exam_paper','exam_mark']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_user', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t);
  END LOOP;
END $$;

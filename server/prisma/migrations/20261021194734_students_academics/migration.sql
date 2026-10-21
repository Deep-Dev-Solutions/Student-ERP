-- CreateTable
CREATE TABLE "school_class" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stage" TEXT,

    CONSTRAINT "school_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "incharge_id" TEXT,

    CONSTRAINT "section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_subject" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "elective" BOOLEAN NOT NULL,

    CONSTRAINT "class_subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "admission_no" TEXT NOT NULL,
    "admission_date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT NOT NULL,
    "photo_url" TEXT,
    "b_form" TEXT,
    "date_of_birth" DATE NOT NULL,
    "gender" TEXT NOT NULL,
    "blood_group" TEXT,
    "religion" TEXT,
    "address" TEXT NOT NULL,
    "previous_school" TEXT,
    "branch_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "elective_subject_ids" TEXT[],
    "sibling_ids" TEXT[],
    "monthly_fee" INTEGER NOT NULL,
    "discount_percent" INTEGER NOT NULL,
    "enrollment" TEXT NOT NULL,
    "withdrawal" JSONB,
    "fee_status" TEXT NOT NULL DEFAULT 'clear',
    "attendance" INTEGER NOT NULL DEFAULT 100,
    "balance" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guardian" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "cnic" TEXT,
    "phone" TEXT NOT NULL,
    "whatsapp" BOOLEAN NOT NULL,
    "primary" BOOLEAN NOT NULL,
    "occupation" TEXT,

    CONSTRAINT "guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_document" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "size_kb" INTEGER NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_activity" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "student_activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_class_branch_id_name_key" ON "school_class"("branch_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "section_class_id_name_key" ON "section"("class_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_tenant_id_name_key" ON "subject"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subject_tenant_id_code_key" ON "subject"("tenant_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "class_subject_class_id_subject_id_key" ON "class_subject"("class_id", "subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_tenant_id_b_form_key" ON "student"("tenant_id", "b_form");

-- AddForeignKey
ALTER TABLE "school_class" ADD CONSTRAINT "school_class_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section" ADD CONSTRAINT "section_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "school_class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject" ADD CONSTRAINT "class_subject_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "school_class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject" ADD CONSTRAINT "class_subject_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guardian" ADD CONSTRAINT "guardian_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_document" ADD CONSTRAINT "student_document_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_activity" ADD CONSTRAINT "student_activity_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Row-level security: same pattern as prisma/migrations/20261021140000_rls.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['school_class','section','subject','class_subject','student','guardian','student_document','student_activity']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_user', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t);
  END LOOP;
END $$;

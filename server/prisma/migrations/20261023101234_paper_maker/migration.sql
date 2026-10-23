-- CreateTable
CREATE TABLE "paper_board" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,

    CONSTRAINT "paper_board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_class" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "paper_class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_book" (
    "id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,

    CONSTRAINT "paper_book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_chapter" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "paper_chapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper_sub_topic" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "paper_sub_topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_question" (
    "id" TEXT NOT NULL,
    "sub_topic_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT[],
    "answer" TEXT NOT NULL,

    CONSTRAINT "bank_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paper" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "teacher_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "step" INTEGER NOT NULL,
    "board_id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "sub_topic_ids" TEXT[],
    "blueprint" JSONB NOT NULL,
    "questions" JSONB NOT NULL,
    "details" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "printed_at" TIMESTAMP(3),
    "return_note" TEXT,
    "history" JSONB NOT NULL,

    CONSTRAINT "paper_pkey" PRIMARY KEY ("id")
);

-- Row-level security: same pattern as prisma/migrations/20261021140000_rls.
-- The catalogue and question bank tables above have no tenant_id: they're global
-- reference data shared by every school, so they stay outside row-level security.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['paper']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_user', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t);
  END LOOP;
END $$;

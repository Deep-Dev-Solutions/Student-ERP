-- CreateTable
CREATE TABLE "message_template" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "built_in" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "message_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_batch" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "branch_id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL,
    "by" TEXT NOT NULL,
    "audience" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "sms_segments" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "message_batch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_template_tenant_id_name_key" ON "message_template"("tenant_id", "name");

-- Row-level security: same pattern as prisma/migrations/20261021140000_rls.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['message_template','message_batch']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_user', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t);
  END LOOP;
END $$;

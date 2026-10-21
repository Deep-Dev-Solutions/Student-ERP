-- Row-level security: school data is only visible to the school it belongs to.
--
-- Every school request runs as `app_user` inside a transaction that first runs
--   SELECT set_config('app.tenant_id', '<school id>', true);
-- (see src/common/prisma/tenant-prisma.ts). With no school set, current_setting()
-- returns NULL and every policy below matches nothing, so a forgotten scope fails
-- closed. The database owner (migrations, seed, auth layer, platform Console) is
-- not subject to these policies.

GRANT USAGE ON SCHEMA public TO app_user;

-- School-owned tables: full access to the current school's rows only.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tenant_event','branch','academic_session','campus_profile','school_rules','tenant_permissions','counter','audit_log']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO app_user', t);
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)) WITH CHECK (tenant_id = current_setting(''app.tenant_id'', true))',
      t);
  END LOOP;
END $$;

-- The school itself: read its own row (plan, modules, status).
GRANT SELECT ON organization TO app_user;
ALTER TABLE organization ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON organization
  USING (id = current_setting('app.tenant_id', true));

-- Memberships of the current school: read, and change status, title and campuses.
GRANT SELECT, UPDATE ON member TO app_user;
ALTER TABLE member ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON member
  USING (organization_id = current_setting('app.tenant_id', true))
  WITH CHECK (organization_id = current_setting('app.tenant_id', true));

-- People: only those who belong to the current school are visible.
GRANT SELECT ON "user" TO app_user;
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_members ON "user"
  USING (EXISTS (
    SELECT 1 FROM member m
    WHERE m.user_id = "user".id AND m.organization_id = current_setting('app.tenant_id', true)
  ));

-- session, account, verification and invitation stay with the auth layer: no grants to app_user.

-- Tables added by later migrations get the same table privileges; each must also
-- enable row-level security with a tenant_isolation policy (checked by the e2e tests).
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

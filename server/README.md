# DeepDev ERP API

NestJS 12, PostgreSQL 16 (row-level security per school), Prisma 7 and better-auth 1.7.
The full design, phases and the map of every frontend endpoint are in [`BACKEND-PLAN.md`](BACKEND-PLAN.md).

## Start

```bash
cp .env.example .env                 # first time
npm install                           # first time
npx prisma migrate deploy && npx prisma generate
npx prisma db seed                   # demo schools; every demo login's password is deepdev123
npm run dev                          # http://localhost:4000/api, Swagger at /api/docs
```

The API runs directly on Node.js. PostgreSQL must be installed and running
locally on port 5432. Create the databases and application role once as a
PostgreSQL administrator:

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE deepdev LOGIN PASSWORD 'deepdev';
CREATE ROLE app_user LOGIN PASSWORD 'app_user';
CREATE DATABASE deepdev OWNER deepdev;
CREATE DATABASE deepdev_test OWNER deepdev;
GRANT CONNECT ON DATABASE deepdev TO app_user;
GRANT CONNECT ON DATABASE deepdev_test TO app_user;
SQL
```

If the `deepdev` or `app_user` roles or either database already exists, skip
those duplicate create statements. The PostgreSQL administrator must be able
to create roles and databases.

## Layout

- `prisma/`: the schema, migrations (including `*_rls`, row-level security) and the dev seed (reads `client/src/mocks`).
- `src/auth/`: better-auth (email and password, organization = school, admin = platform admin).
- `src/common/`:
  - `guards/`: signed in → school → module → permission, in that order.
  - `prisma/`: the owner client, plus the school-scoped client that sets `app.tenant_id`.
  - `modules.ts`: kept identical to `client/src/lib/modules.ts`; a unit test checks it.
- `src/modules/`: one folder per area (me, tenant, branches, sessions, users, settings, …).
- `test/unit`, `test/e2e`: Node's test runner against `dist/` (`npm test`, `npm run test:e2e`). The e2e suite uses the local `deepdev_test` database.

## Rules for new endpoints

- Put `@RequireModule('<module>')` on the controller and `@RequirePermission('<id>')` on mutations, and map new permissions in `src/common/modules.ts` and in the client.
- School data goes through `prisma.tenant` (or `prisma.tx`). `prisma.system` bypasses row-level security, so it's only for the auth layer and the Console, always with an explicit school filter.
- Every new table with `tenant_id` needs row-level security and a `tenant_isolation` policy in its migration. The e2e suite fails otherwise.
- Return the same shapes as `client/src/types` and errors as `{ status, message }`, then add the endpoint to `MIGRATED` in `client/src/lib/api-mode.ts`.

import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations and the seed run as the database owner, which row-level security doesn't restrict.
  datasource: { url: env("DATABASE_URL") },
});

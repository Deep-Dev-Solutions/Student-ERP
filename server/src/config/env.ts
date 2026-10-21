import "dotenv/config";
import { z } from "zod";

/** Environment, checked once at start-up so a missing setting fails fast. */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  APP_DATABASE_URL: z.string().url(),
  /** Where the web app runs; several comma-separated origins are allowed (e.g. local ports). */
  WEB_ORIGIN: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
});

export const env = schema.parse(process.env);

/** Origins better-auth accepts sign-ins from. The first is used for links in emails. */
export const webOrigins = env.WEB_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);

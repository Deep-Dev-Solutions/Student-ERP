import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, organization } from "better-auth/plugins";
import { env, webOrigins } from "../config/env";
import type { PrismaClient } from "../generated/prisma/client";

/** Messages the auth layer would email (password reset, invites). Kept here until an email provider is chosen. */
export interface OutboxMessage {
  to: string;
  subject: string;
  url: string;
  at: string;
}
export const authOutbox: OutboxMessage[] = [];

/**
 * better-auth: email and password sign-in with sessions in an httpOnly cookie.
 * - organization plugin: a school is an organization; membership carries the school role.
 * - admin plugin: platform admins (user.role "admin") and impersonation for "View as owner".
 * Runs on the database owner connection: auth needs to see users across schools.
 */
export function createAuth(prisma: PrismaClient) {
  return betterAuth({
    appName: "DeepDev ERP",
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    secret: env.BETTER_AUTH_SECRET,
    trustedOrigins: webOrigins,
    database: prismaAdapter(prisma, { provider: "postgresql" }),
    emailAndPassword: {
      enabled: true,
      // Schools and staff are created by the Console and by invites, never by self sign-up.
      disableSignUp: true,
      minPasswordLength: 8,
      // Invited staff have no password yet; the reset link is how they set one.
      sendResetPassword: async ({ user, url }) => {
        authOutbox.push({ to: user.email, subject: "Set your DeepDev ERP password", url, at: new Date().toISOString() });
        if (env.NODE_ENV !== "test") console.log(`[auth] password link for ${user.email}: ${url}`);
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: { cookiePrefix: "deepdev" },
    plugins: [
      organization({ allowUserToCreateOrganization: false }),
      admin({ adminRoles: ["admin"], defaultRole: "user" }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

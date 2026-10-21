import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../../config/env";
import { requireTenantId } from "../context";
import { Prisma, PrismaClient } from "../../generated/prisma/client";

/** A Prisma client where every model query runs with the current school set, so row-level security applies. */
function scopedToTenant(base: PrismaClient) {
  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const tenantId = requireTenantId();
          const [, result] = await base.$transaction([base.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, TRUE)`, query(args)]);
          return result;
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof scopedToTenant>;

@Injectable()
export class PrismaService implements OnModuleDestroy {
  /**
   * The database owner: not limited by row-level security. Only for the auth layer,
   * the platform Console and resolving who the caller is. Always filter by school explicitly.
   */
  readonly system = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.DATABASE_URL }) });

  private readonly appBase = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.APP_DATABASE_URL }) });

  /** School data for the current request; row-level security keeps it to the caller's school. */
  readonly tenant: TenantClient = scopedToTenant(this.appBase);

  /** Several school queries in one transaction (all-or-nothing), with the school set first. */
  async tx<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const tenantId = requireTenantId();
    return this.appBase.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, TRUE)`;
      return fn(tx);
    });
  }

  async onModuleDestroy() {
    await Promise.all([this.system.$disconnect(), this.appBase.$disconnect()]);
  }
}

import { Global, Injectable, Module } from "@nestjs/common";
import { Prisma } from "../generated/prisma/client";
import { actorName, currentContext, requireTenantId } from "./context";
import { PrismaService } from "./prisma/prisma.service";

/** Records who changed what, for activity logs and the Console history. */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(action: string, entity: string, entityId?: string, data?: unknown) {
    return this.prisma.tenant.auditLog.create({
      data: {
        tenantId: requireTenantId(),
        actorId: currentContext().userId,
        actorName: actorName(),
        action,
        entity,
        entityId,
        data: data === undefined ? Prisma.JsonNull : (data as Prisma.InputJsonValue),
      },
    });
  }
}

@Global()
@Module({ providers: [AuditService], exports: [AuditService] })
export class AuditModule {}

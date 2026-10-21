import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { currentContext } from "../context";
import { PERMISSION_KEY } from "../decorators";
import { fail } from "../errors";
import { MODULE_NAMES, moduleForPermission } from "../modules";
import { hasPermission, type PermissionMatrix } from "../permissions";
import { PrismaService } from "../prisma/prisma.service";

/** 4. The caller's role must hold the route's permission in the school's matrix (@RequirePermission). */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const id = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [context.getHandler(), context.getClass()]);
    if (!id) return true;
    const ctx = currentContext();
    const module = moduleForPermission(id);
    if (module && !ctx.modules?.includes(module)) throw fail(403, `${MODULE_NAMES[module]} isn't part of your plan`);
    const row = await this.prisma.tenant.tenantPermissions.findFirst();
    if (!hasPermission(ctx.role ?? "", id, (row?.matrix ?? {}) as PermissionMatrix)) throw fail(403, "Your role can't do this");
    return true;
  }
}

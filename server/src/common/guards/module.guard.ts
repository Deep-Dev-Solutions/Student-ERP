import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { ModuleKey } from "../../generated/prisma/enums";
import { currentContext } from "../context";
import { MODULE_KEY } from "../decorators";
import { fail } from "../errors";
import { MODULE_NAMES } from "../modules";

/** 3. The school must have the route's module on its plan (@RequireModule). */
@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const key = this.reflector.getAllAndOverride<ModuleKey | undefined>(MODULE_KEY, [context.getHandler(), context.getClass()]);
    if (!key) return true;
    if (!currentContext().modules?.includes(key)) throw fail(403, `${MODULE_NAMES[key]} isn't part of your plan`);
    return true;
  }
}

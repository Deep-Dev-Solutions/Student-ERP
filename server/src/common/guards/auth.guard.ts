import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { AuthService } from "../../auth/auth.service";
import { currentContext } from "../context";
import { PUBLIC_KEY } from "../decorators";
import { fail } from "../errors";

type AuthSession = NonNullable<Awaited<ReturnType<AuthService["auth"]["api"]["getSession"]>>>;
export type AuthedRequest = Request & { authSession: AuthSession };

/** 1. A valid better-auth session (cookie), or 401. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const found = await this.authService.auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!found) throw fail(401, "Sign in to continue");
    req.authSession = found;
    Object.assign(currentContext(), {
      userId: found.user.id,
      userName: found.user.name,
      platformRole: (found.user as { role?: string | null }).role ?? null,
      impersonatedBy: (found.session as { impersonatedBy?: string | null }).impersonatedBy ?? null,
    });
    return true;
  }
}

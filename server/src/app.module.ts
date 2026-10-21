import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { AuthModule } from "./auth/auth.module";
import { AuditModule } from "./common/audit.service";
import { ErrorFilter } from "./common/errors";
import { AuthGuard } from "./common/guards/auth.guard";
import { ModuleGuard } from "./common/guards/module.guard";
import { PermissionGuard } from "./common/guards/permission.guard";
import { TenantGuard } from "./common/guards/tenant.guard";
import { PrismaModule } from "./common/prisma/prisma.module";
import { BranchesController } from "./modules/branches/branches.controller";
import { HealthController } from "./modules/health/health.controller";
import { MeController } from "./modules/me/me.controller";
import { SessionsController } from "./modules/sessions/sessions.controller";
import { SettingsController } from "./modules/settings/settings.controller";
import { TenantController } from "./modules/tenant/tenant.controller";
import { UsersController } from "./modules/users/users.controller";

@Module({
  imports: [PrismaModule, AuthModule, AuditModule],
  controllers: [HealthController, MeController, TenantController, BranchesController, SessionsController, UsersController, SettingsController],
  providers: [
    // Every route passes these in order: signed in → school → module on the plan → permission.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: ModuleGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
    { provide: APP_FILTER, useClass: ErrorFilter },
  ],
})
export class AppModule {}

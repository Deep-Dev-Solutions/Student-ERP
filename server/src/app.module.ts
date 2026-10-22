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
import { AcademicsModule } from "./modules/academics/academics.module";
import { BranchesModule } from "./modules/branches/branches.module";
import { HealthModule } from "./modules/health/health.module";
import { MeModule } from "./modules/me/me.module";
import { SessionsModule } from "./modules/sessions/sessions.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { StudentsModule } from "./modules/students/students.module";
import { TenantModule } from "./modules/tenant/tenant.module";
import { UsersModule } from "./modules/users/users.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AuditModule,
    HealthModule,
    MeModule,
    TenantModule,
    BranchesModule,
    SessionsModule,
    UsersModule,
    SettingsModule,
    AcademicsModule,
    StudentsModule,
  ],
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

import { Body, Controller, Get, Post, Put } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsISO8601, IsString, Matches } from "class-validator";
import { AuditService } from "../../common/audit.service";
import { requireTenantId } from "../../common/context";
import { RequirePermission } from "../../common/decorators";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { parseDay, toSession } from "../../common/shapes";

class AddSessionDto {
  @IsString() @Matches(/^\d{4}-\d{4}$/, { message: "The session should look like 2026-2027" }) label!: string;
  @IsISO8601({ strict: true }) startDate!: string;
  @IsISO8601({ strict: true }) endDate!: string;
}
class CurrentSessionDto {
  @IsString() sessionId!: string;
}

@ApiTags("sessions")
@Controller("sessions")
export class SessionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getSessions: newest first. */
  @Get()
  async list() {
    const rows = await this.prisma.tenant.academicSession.findMany({ orderBy: { startDate: "desc" } });
    return rows.map(toSession);
  }

  /** addSession */
  @RequirePermission("adm_system_settings")
  @Post()
  async add(@Body() body: AddSessionDto) {
    if (body.endDate <= body.startDate) throw fail(400, "The session must end after it starts");
    if (await this.prisma.tenant.academicSession.findFirst({ where: { label: body.label } })) throw fail(409, `Session ${body.label} already exists`);
    const created = await this.prisma.tenant.academicSession.create({
      data: { tenantId: requireTenantId(), label: body.label, startDate: parseDay(body.startDate), endDate: parseDay(body.endDate), current: false },
    });
    await this.audit.record("session.added", "academic_session", created.id, { label: created.label });
    return toSession(created);
  }

  /** setCurrentSession: exactly one session is current. */
  @RequirePermission("adm_system_settings")
  @Put("current")
  async setCurrent(@Body() body: CurrentSessionDto) {
    await this.prisma.tx(async (tx) => {
      const found = await tx.academicSession.findFirst({ where: { id: body.sessionId } });
      if (!found) throw fail(404, "Session not found");
      await tx.academicSession.updateMany({ data: { current: false } });
      await tx.academicSession.update({ where: { id: body.sessionId }, data: { current: true } });
    });
    await this.audit.record("session.made_current", "academic_session", body.sessionId);
    return null;
  }
}

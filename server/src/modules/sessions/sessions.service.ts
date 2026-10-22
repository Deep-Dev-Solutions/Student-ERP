import { Injectable } from "@nestjs/common";
import { AuditService } from "../../common/audit.service";
import { requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { parseDay, toSession } from "../../common/shapes";
import type { AddSessionDto } from "./dto/session.dto";

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getSessions: newest first. */
  async list() {
    const rows = await this.prisma.tenant.academicSession.findMany({ orderBy: { startDate: "desc" } });
    return rows.map(toSession);
  }

  /** addSession */
  async add(body: AddSessionDto) {
    if (body.endDate <= body.startDate) throw fail(400, "The session must end after it starts");
    if (await this.prisma.tenant.academicSession.findFirst({ where: { label: body.label } })) throw fail(409, `Session ${body.label} already exists`);
    const created = await this.prisma.tenant.academicSession.create({
      data: { tenantId: requireTenantId(), label: body.label, startDate: parseDay(body.startDate), endDate: parseDay(body.endDate), current: false },
    });
    await this.audit.record("session.added", "academic_session", created.id, { label: created.label });
    return toSession(created);
  }

  /** setCurrentSession: exactly one session is current. */
  async setCurrent(sessionId: string) {
    await this.prisma.tx(async (tx) => {
      const found = await tx.academicSession.findFirst({ where: { id: sessionId } });
      if (!found) throw fail(404, "Session not found");
      await tx.academicSession.updateMany({ data: { current: false } });
      await tx.academicSession.update({ where: { id: sessionId }, data: { current: true } });
    });
    await this.audit.record("session.made_current", "academic_session", sessionId);
    return null;
  }
}

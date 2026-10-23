import { Injectable } from "@nestjs/common";
import { messageCost, smsSegments } from "../../domain/messaging";
import { AuditService } from "../../common/audit.service";
import { actorName, requireTenantId } from "../../common/context";
import { fail } from "../../common/errors";
import { PrismaService } from "../../common/prisma/prisma.service";
import { toMessageBatch, toMessageTemplate } from "../../common/shapes";
import { Prisma } from "../../generated/prisma/client";
import type { SaveTemplateDto } from "./dto/save-template.dto";
import type { SendMessagesDto } from "./dto/send-messages.dto";

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** getMessages */
  async list() {
    return (await this.prisma.tenant.messageBatch.findMany({ orderBy: { at: "desc" } })).map(toMessageBatch);
  }

  /** getMessageTemplates */
  async listTemplates() {
    return (await this.prisma.tenant.messageTemplate.findMany({ orderBy: { name: "asc" } })).map(toMessageTemplate);
  }

  /** sendMessages: the audience is already resolved and rendered client-side; this validates, prices and records the send. */
  async send(body: SendMessagesDto) {
    if (body.recipients.length === 0) throw fail(400, "Nobody in this audience has a mobile number");
    if (body.recipients.some((r) => !r.text.trim())) throw fail(400, "Write the message first");
    if (body.recipients.some((r) => /\{\w+\}/.test(r.text))) throw fail(400, "The message has a placeholder this audience can't fill; remove it");

    const batch = await this.prisma.tenant.messageBatch.create({
      data: {
        tenantId: requireTenantId(),
        branchId: body.branchId,
        at: new Date(),
        by: actorName(),
        audience: body.audience,
        channel: body.channel,
        template: body.template,
        recipients: body.recipients as unknown as Prisma.InputJsonValue,
        smsSegments: body.recipients.filter((r) => r.channel === "sms").reduce((n, r) => n + smsSegments(r.text), 0),
        cost: body.recipients.reduce((n, r) => n + messageCost(r.channel, r.text), 0),
      },
    });
    await this.audit.record("message.sent", "message_batch", batch.id, { audience: body.audience, recipients: body.recipients.length });
    return toMessageBatch(batch);
  }

  /** saveMessageTemplate: always adds a new template; there's no editing an existing one. */
  async saveTemplate(body: SaveTemplateDto) {
    const name = body.name.trim();
    const text = body.body.trim();
    if (name.length < 3) throw fail(400, "Give the template a name");
    if (text.length < 10) throw fail(400, "Write the template text");
    if (await this.prisma.tenant.messageTemplate.findFirst({ where: { name: { equals: name, mode: "insensitive" } } }))
      throw fail(409, "A template with this name already exists");

    const template = await this.prisma.tenant.messageTemplate.create({ data: { tenantId: requireTenantId(), name, body: text } });
    await this.audit.record("message_template.saved", "message_template", template.id, { name });
    return toMessageTemplate(template);
  }

  /** deleteMessageTemplate */
  async deleteTemplate(id: string) {
    const template = await this.prisma.tenant.messageTemplate.findFirst({ where: { id } });
    if (!template) throw fail(404, "Template not found");
    if (template.builtIn) throw fail(409, "Built-in templates can't be deleted");
    await this.prisma.tenant.messageTemplate.delete({ where: { id } });
    await this.audit.record("message_template.deleted", "message_template", id);
    return null;
  }
}

import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequireModule, RequirePermission } from "../../common/decorators";
import { MessagesService } from "./messages.service";
import { SendMessagesDto } from "./dto/send-messages.dto";
import { SaveTemplateDto } from "./dto/save-template.dto";

/** WhatsApp/SMS sends and templates. Gated behind the Messages module. */
@ApiTags("messages")
@RequireModule("messages")
@Controller()
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /** getMessages */
  @Get("messages")
  list() {
    return this.messages.list();
  }

  /** getMessageTemplates */
  @Get("message-templates")
  listTemplates() {
    return this.messages.listTemplates();
  }

  /** sendMessages: runs synchronously for now, same as every other "(job)" endpoint before BullMQ is wired in. */
  @RequirePermission("fin_send_sms")
  @Post("messages")
  send(@Body() body: SendMessagesDto) {
    return this.messages.send(body);
  }

  /** saveMessageTemplate */
  @RequirePermission("fin_send_sms")
  @Post("message-templates")
  saveTemplate(@Body() body: SaveTemplateDto) {
    return this.messages.saveTemplate(body);
  }

  /** deleteMessageTemplate */
  @RequirePermission("fin_send_sms")
  @Delete("message-templates/:id")
  deleteTemplate(@Param("id") id: string) {
    return this.messages.deleteTemplate(id);
  }
}

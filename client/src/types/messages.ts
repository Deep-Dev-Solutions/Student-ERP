export type MessageChannel = "whatsapp" | "sms";

export type AudienceKind = "all_parents" | "class_parents" | "defaulters" | "absent_today" | "all_staff" | "teachers";

export interface MessageTemplate {
  id: string;
  name: string;
  /** Text with placeholders such as {name}, {student}, {class}, {amount}, {date}, {school}. */
  body: string;
  builtIn?: boolean;
}

export interface MessageRecipient {
  name: string;
  phone: string;
  /** The channel this person was actually sent on (WhatsApp falls back to SMS). */
  channel: MessageChannel;
  text: string;
}

/** One send: a message to an audience, with its cost estimate. */
export interface MessageBatch {
  id: string;
  branchId: string;
  at: string;
  by: string;
  audience: string;
  channel: MessageChannel;
  template: string;
  recipients: MessageRecipient[];
  /** SMS segments across all SMS recipients. */
  smsSegments: number;
  cost: number;
}

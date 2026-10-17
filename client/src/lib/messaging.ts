/*
 * Message costs and templates. The rates are estimates for planning;
 * the real figures come from the SMS and WhatsApp providers.
 */
import type { MessageChannel } from "@/types";

/** Rupees per SMS segment. */
export const SMS_RATE = 1.5;
/** Rupees per WhatsApp message (utility template). */
export const WHATSAPP_RATE = 2.5;

/** Characters outside plain SMS text (such as Urdu) make each segment shorter. */
const isUnicode = (text: string) => /[^\x0A\x0D\x20-\x7E£¥èéùìòÇØøÅå]/.test(text);

/** How many SMS segments a text takes. */
export function smsSegments(text: string) {
  if (!text) return 0;
  const [single, multi] = isUnicode(text) ? [70, 67] : [160, 153];
  return text.length <= single ? 1 : Math.ceil(text.length / multi);
}

export function messageCost(channel: MessageChannel, text: string) {
  return channel === "whatsapp" ? WHATSAPP_RATE : smsSegments(text) * SMS_RATE;
}

export const PLACEHOLDERS = ["name", "student", "class", "amount", "date", "school"] as const;
export type TemplateVars = Partial<Record<(typeof PLACEHOLDERS)[number], string>>;

/** Fills {placeholders}; unknown ones are left as typed so they're easy to spot. */
export function renderTemplate(body: string, vars: TemplateVars) {
  return body.replace(/\{(\w+)\}/g, (match, key: string) => vars[key as keyof TemplateVars] ?? match);
}

/** WhatsApp goes to SMS for numbers without WhatsApp when the school allows it; otherwise the person is skipped. */
export function deliveryChannel(channel: MessageChannel, hasWhatsApp: boolean, smsFallback: boolean): MessageChannel | null {
  if (channel === "sms" || hasWhatsApp) return channel;
  return smsFallback ? "sms" : null;
}

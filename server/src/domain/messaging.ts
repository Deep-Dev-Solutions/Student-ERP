// Ported from client/src/lib/messaging.ts: the parts the server needs to recompute
// a message batch's cost rather than trust whatever the client sends.

export type MessageChannel = "whatsapp" | "sms";

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

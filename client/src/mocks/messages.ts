/* Demo data until the API exists. Read it through @/store/api, not directly from components. */
import type { MessageBatch, MessageTemplate } from "@/types";

export const messageTemplates: MessageTemplate[] = [
  { id: "tpl-fee", name: "Fee reminder", builtIn: true, body: "Dear {name}, the fee of {amount} for {student} ({class}) is overdue. Please pay at the school office or bank. {school}" },
  { id: "tpl-absent", name: "Absence alert", builtIn: true, body: "Dear {name}, {student} ({class}) was absent today, {date}. Please contact the class teacher if this is unexpected. {school}" },
  { id: "tpl-holiday", name: "Holiday notice", builtIn: true, body: "Dear {name}, the school will be closed on {date}. Classes resume the next working day. {school}" },
  { id: "tpl-results", name: "Results published", builtIn: true, body: "Dear {name}, results for {student} ({class}) are out. Collect the report card from the class teacher. {school}" },
  { id: "tpl-ptm", name: "Parent-teacher meeting", builtIn: true, body: "Dear {name}, you're invited to the parent-teacher meeting for {class} on {date}, 9 AM to 12 PM. {school}" },
  { id: "tpl-staff", name: "Staff notice", builtIn: true, body: "Dear {name}, staff meeting on {date} at 2 PM in the main hall. {school}" },
];

export const messages: MessageBatch[] = [
  {
    id: "msg-1",
    branchId: "br-1",
    at: "2026-10-05T11:30:00",
    by: "Sana Javed (Front desk)",
    audience: "Parents of Class 9",
    channel: "whatsapp",
    template: "Parent-teacher meeting",
    recipients: [
      { name: "Muhammad Khan", phone: "0300-1234567", channel: "whatsapp", text: "Dear Muhammad Khan, you're invited to the parent-teacher meeting for Class 9 on 10 Oct, 9 AM to 12 PM. Apex Grammar & Science Academy" },
      { name: "Imran Raza", phone: "0310-4000000", channel: "sms", text: "Dear Imran Raza, you're invited to the parent-teacher meeting for Class 9 on 10 Oct, 9 AM to 12 PM. Apex Grammar & Science Academy" },
    ],
    smsSegments: 1,
    cost: 4,
  },
];

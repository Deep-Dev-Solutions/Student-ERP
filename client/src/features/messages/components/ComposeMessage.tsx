"use client";

import { useState } from "react";
import { MessageSquareText, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { useBranchClasses, useClassSections, useReadOnly } from "@/hooks/use-academics";
import { useCan, useCurrentBranch } from "@/hooks/use-session";
import { formatRupees } from "@/lib/format";
import { deliveryChannel, messageCost, PLACEHOLDERS, renderTemplate, smsSegments } from "@/lib/messaging";
import { errorMessage, useGetMessageTemplatesQuery, useGetSchoolRulesQuery, useSendMessagesMutation } from "@/store/api";
import type { AudienceKind, MessageChannel } from "@/types";
import { useAudience, useAudienceOptions } from "../useAudience";

const channelOptions: { value: MessageChannel; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
];
const CUSTOM = "custom";
const ALL = "all";

export function ComposeMessage() {
  const readOnly = useReadOnly();
  const canSend = useCan("fin_send_sms") && !readOnly;
  const branch = useCurrentBranch();
  const classes = useBranchClasses();
  const { data: templates = [] } = useGetMessageTemplatesQuery();
  const smsFallback = useGetSchoolRulesQuery().data?.notifications.smsFallback ?? true;
  const [send, { isLoading }] = useSendMessagesMutation();
  const options = useAudienceOptions();
  const [pickedKind, setKind] = useState<AudienceKind>("all_parents");
  const kind = options.some((o) => o.value === pickedKind) ? pickedKind : (options[0]?.value ?? "all_parents");
  const [classId, setClassId] = useState(classes.at(-1)?.id ?? "");
  const sections = useClassSections(classId);
  const [sectionId, setSectionId] = useState(ALL);
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const [templateId, setTemplateId] = useState(CUSTOM);
  const [body, setBody] = useState("");
  const [dateText, setDateText] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});

  const { contacts, label, skipped } = useAudience({ kind, classId, sectionId: sectionId === ALL ? "" : sectionId });
  const recipients = contacts.flatMap((c) => {
    const via = deliveryChannel(channel, c.hasWhatsApp, smsFallback);
    return via ? [{ name: c.name, phone: c.phone, channel: via, text: renderTemplate(body, { ...c.vars, ...(dateText ? { date: dateText } : {}) }) }] : [];
  });
  const noWhatsApp = contacts.length - recipients.length;
  const bySms = recipients.filter((r) => r.channel === "sms");
  const cost = recipients.reduce((n, r) => n + messageCost(r.channel, r.text), 0);
  const sample = recipients[0];
  const unfilled = sample ? [...sample.text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]) : [];
  const templateName = templates.find((t) => t.id === templateId)?.name ?? "Custom message";

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) setBody(t.body);
  };

  const confirmSend = async () => {
    if (!branch) return;
    const result = await send({ branchId: branch.id, audience: label, channel, template: templateName, recipients });
    setConfirming(false);
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ success: `Message sent to ${result.data.recipients.length} people. Estimated cost ${formatRupees(result.data.cost)}. It's in the Send log.` });
    setBody("");
    setTemplateId(CUSTOM);
  };

  if (options.length === 0) {
    return (
      <Card className="py-0">
        <EmptyState icon={MessageSquareText} title="No one to message yet" description="Messages go to parents (Students and admissions) or staff (Staff and HR). Add one of those modules to send messages." />
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="gap-5 px-5 sm:px-6 lg:col-span-3">
        <div>
          <CardTitle>
            <h2>New message</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Send a WhatsApp message or SMS to parents or staff at this campus.</CardDescription>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField id="msg-audience" label="Send to" options={options} value={kind} onValueChange={(v) => setKind(v as AudienceKind)} />
          <SelectField id="msg-channel" label="Send by" options={channelOptions} value={channel} onValueChange={(v) => setChannel(v as MessageChannel)} />
          {kind === "class_parents" ? (
            <>
              <SelectField
                id="msg-class"
                label="Class"
                options={classes.map((c) => ({ value: c.id, label: c.name }))}
                value={classId}
                onValueChange={(v) => {
                  setClassId(v);
                  setSectionId(ALL);
                }}
              />
              <SelectField id="msg-section" label="Section" options={[{ value: ALL, label: "All sections" }, ...sections.map((s) => ({ value: s.id, label: `Section ${s.name}` }))]} value={sectionId} onValueChange={setSectionId} />
            </>
          ) : null}
          <SelectField
            id="msg-template"
            label="Template"
            className="sm:col-span-2"
            options={[{ value: CUSTOM, label: "Write my own" }, ...templates.map((t) => ({ value: t.id, label: t.name }))]}
            value={templateId}
            onValueChange={pickTemplate}
          />
        </div>
        <div>
          <label htmlFor="msg-body" className="mb-1.5 block text-sm font-medium">
            Message
          </label>
          <textarea
            id="msg-body"
            rows={5}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-describedby="msg-body-hint"
            placeholder="Type the message, or pick a template."
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          />
          <p id="msg-body-hint" className="mt-1 text-xs text-muted-foreground">
            Placeholders fill in for each person: {PLACEHOLDERS.map((p) => `{${p}}`).join(", ")}.
          </p>
        </div>
        {body.includes("{date}") ? (
          <TextField id="msg-date" label="Date in the message" placeholder="e.g. 25 Oct" hint="Leave blank to use today's date." value={dateText} onChange={(e) => setDateText(e.target.value)} />
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <FormStatus success={notice.success} error={notice.error} />
          <Button
            disabled={!canSend || !body.trim() || recipients.length === 0 || unfilled.length > 0}
            onClick={() => {
              setNotice({});
              setConfirming(true);
            }}
          >
            <Send data-icon="inline-start" />
            Send to {recipients.length} {recipients.length === 1 ? "person" : "people"}
          </Button>
        </div>
      </Card>

      <Card className="gap-4 px-5 sm:px-6 lg:col-span-2">
        <CardTitle>
          <h2>Preview</h2>
        </CardTitle>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Recipients</dt>
            <dd className="mt-0.5 text-lg font-semibold">{recipients.length}</dd>
          </div>
          <div className="rounded-lg border border-border px-3 py-2">
            <dt className="text-xs text-muted-foreground">Estimated cost</dt>
            <dd className="mt-0.5 text-lg font-semibold">{formatRupees(cost)}</dd>
          </div>
        </dl>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>{label}.</li>
          {channel === "whatsapp" ? (
            <li>
              {recipients.length - bySms.length} by WhatsApp
              {bySms.length ? `, ${bySms.length} by SMS (no WhatsApp on that number)` : ""}.
            </li>
          ) : null}
          {noWhatsApp > 0 ? <li>{noWhatsApp} without WhatsApp are skipped; SMS fallback is off in Settings.</li> : null}
          {skipped > 0 ? <li>{skipped} have no mobile number on file.</li> : null}
          {sample && (channel === "sms" || bySms.length) ? (
            <li>
              {sample.text.length} characters, {smsSegments(sample.text)} SMS {smsSegments(sample.text) === 1 ? "part" : "parts"} each.
            </li>
          ) : null}
        </ul>
        {sample && body.trim() ? (
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">As {sample.name} will see it:</p>
            <p className="rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap">{sample.text}</p>
          </div>
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquareText aria-hidden className="size-4" />
            {recipients.length ? "Write a message to see it here." : "Nobody in this audience can be reached."}
          </p>
        )}
        {unfilled.length ? <FormStatus error={`{${unfilled[0]}} can't be filled for this audience. Remove it or check the spelling.`} /> : null}
      </Card>

      {confirming ? (
        <Dialog open onOpenChange={(open) => !open && setConfirming(false)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Send to {recipients.length} {recipients.length === 1 ? "person" : "people"}?
              </DialogTitle>
              <DialogDescription>
                {label}, by {channel === "whatsapp" ? "WhatsApp" : "SMS"}. Estimated cost {formatRupees(cost)}. Messages can&apos;t be recalled once sent.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
              <Button disabled={isLoading} onClick={confirmSend}>
                <Send data-icon="inline-start" />
                Send now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

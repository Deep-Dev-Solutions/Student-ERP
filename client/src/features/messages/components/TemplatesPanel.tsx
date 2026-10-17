"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { useReadOnly } from "@/hooks/use-academics";
import { useCan } from "@/hooks/use-session";
import { PLACEHOLDERS } from "@/lib/messaging";
import { errorMessage, useDeleteMessageTemplateMutation, useGetMessageTemplatesQuery, useSaveMessageTemplateMutation } from "@/store/api";

export function TemplatesPanel() {
  const readOnly = useReadOnly();
  const canEdit = useCan("fin_send_sms") && !readOnly;
  const { data: templates = [] } = useGetMessageTemplatesQuery();
  const [save, { isLoading }] = useSaveMessageTemplateMutation();
  const [remove] = useDeleteMessageTemplateMutation();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<{ success?: string; error?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await save({ name, body });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ success: `${result.data.name} saved. Pick it under New message.` });
    setName("");
    setBody("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="gap-0 py-0 lg:col-span-3">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">Templates</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Ready-made messages. Built-in templates can&apos;t be deleted.</p>
        </div>
        <ul className="divide-y divide-border">
          {templates.map((t) => (
            <li key={t.id} className="flex items-start justify-between gap-3 px-5 py-3 sm:px-6">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {t.name}
                  {t.builtIn ? <Badge variant="neutral">Built in</Badge> : null}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t.body}</p>
              </div>
              {!t.builtIn && canEdit ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${t.name}`}
                  onClick={async () => {
                    const result = await remove(t.id);
                    setNotice("error" in result ? { error: errorMessage(result.error) } : { success: `${t.name} deleted.` });
                  }}
                  className="shrink-0 text-muted-foreground hover:bg-danger-tint hover:text-danger"
                >
                  <Trash2 />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </Card>
      {canEdit ? (
        <Card className="gap-4 px-5 sm:px-6 lg:col-span-2">
          <div>
            <CardTitle>
              <h2>New template</h2>
            </CardTitle>
            <CardDescription className="mt-0.5">Use {PLACEHOLDERS.map((p) => `{${p}}`).join(", ")} to personalise it.</CardDescription>
          </div>
          <form onSubmit={submit} noValidate className="space-y-4">
            <TextField id="tpl-name" label="Name" placeholder="e.g. Sports day" value={name} onChange={(e) => setName(e.target.value)} />
            <div>
              <label htmlFor="tpl-body" className="mb-1.5 block text-sm font-medium">
                Text
              </label>
              <textarea
                id="tpl-body"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              />
            </div>
            <FormStatus success={notice.success} error={notice.error} />
            <Button type="submit" disabled={isLoading}>
              <Plus data-icon="inline-start" />
              Save template
            </Button>
          </form>
        </Card>
      ) : (
        <FormStatus success={notice.success} error={notice.error} />
      )}
    </div>
  );
}

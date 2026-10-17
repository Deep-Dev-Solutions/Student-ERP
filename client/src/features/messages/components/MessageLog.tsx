"use client";

import { useState } from "react";
import { Eye, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { useCurrentBranch } from "@/hooks/use-session";
import { formatRupees } from "@/lib/format";
import { useGetMessagesQuery } from "@/store/api";
import type { MessageBatch } from "@/types";

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export function MessageLog() {
  const branch = useCurrentBranch();
  const { data: messages = [] } = useGetMessagesQuery();
  const [viewing, setViewing] = useState<MessageBatch | null>(null);
  const mine = messages.filter((m) => m.branchId === branch?.id).sort((a, b) => b.at.localeCompare(a.at));
  const monthCost = mine.filter((m) => m.at.slice(0, 7) === mine[0]?.at.slice(0, 7)).reduce((n, m) => n + m.cost, 0);

  return (
    <Card className="gap-0 py-0">
      <div className="border-b border-border p-5 sm:p-6">
        <h2 className="text-base font-semibold">Send log</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Every message sent from this campus, including fee reminders and absence alerts.
          {mine.length ? ` ${formatRupees(monthCost)} spent in the latest month.` : ""}
        </p>
      </div>
      {mine.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing sent yet" description="Messages you send appear here with their cost." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Message</TableHead>
              <TableHead className="hidden lg:table-cell">Sent</TableHead>
              <TableHead className="hidden sm:table-cell">By</TableHead>
              <TableHead className="text-right">People</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Cost</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">View</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mine.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="min-w-44 pl-5 whitespace-normal">
                  <p className="font-medium">{m.template}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.audience}
                    <span className="lg:hidden">, {when(m.at)}</span>
                  </p>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{when(m.at)}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={m.channel === "whatsapp" ? "success" : "info"}>{m.channel === "whatsapp" ? "WhatsApp" : "SMS"}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{m.recipients.length}</TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">{formatRupees(m.cost)}</TableCell>
                <TableCell className="pr-5 text-right">
                  <Button variant="ghost" size="icon-sm" aria-label={`View ${m.template} sent ${when(m.at)}`} onClick={() => setViewing(m)}>
                    <Eye />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {viewing ? (
        <Dialog open onOpenChange={(open) => !open && setViewing(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewing.template}</DialogTitle>
              <DialogDescription>
                {viewing.audience}. Sent {when(viewing.at)} by {viewing.by}. {viewing.recipients.length} people, {formatRupees(viewing.cost)}
                {viewing.smsSegments ? `, ${viewing.smsSegments} SMS parts` : ""}.
              </DialogDescription>
            </DialogHeader>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border text-sm">
              {viewing.recipients.map((r, i) => (
                <li key={`${r.phone}-${i}`} className="space-y-1 px-3 py-2">
                  <p className="flex items-center justify-between gap-2">
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.phone}, {r.channel === "whatsapp" ? "WhatsApp" : "SMS"}
                    </span>
                  </p>
                  <p className="text-muted-foreground">{r.text}</p>
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}

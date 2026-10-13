"use client";

import { useState } from "react";
import { CalendarRange, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { useCurrentSession } from "@/hooks/use-academics";
import { formatDate } from "@/lib/format";
import { errorMessage, useAddSessionMutation, useGetSessionsQuery, useSetCurrentSessionMutation } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { sessionSelected } from "@/store/sessionSlice";
import type { AcademicSession } from "@/types";

function statusOf(session: AcademicSession, current: AcademicSession | undefined) {
  if (session.current) return { label: "Current", variant: "success" as const };
  if (current && session.startDate > current.startDate) return { label: "Upcoming", variant: "info" as const };
  return { label: "Closed, read-only", variant: "neutral" as const };
}

export function SessionsPanel() {
  const dispatch = useAppDispatch();
  const { data: sessions = [] } = useGetSessionsQuery();
  const current = useCurrentSession();
  const [addSession, addState] = useAddSessionMutation();
  const [setCurrent] = useSetCurrentSessionMutation();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});

  const label = startDate && endDate ? `${startDate.slice(0, 4)}-${endDate.slice(0, 4)}` : "";

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label) return;
    const result = await addSession({ label, startDate, endDate });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ ok: `Session ${label} added. Make it current when the new year starts.` });
    setStartDate("");
    setEndDate("");
  };

  const makeCurrent = async (session: AcademicSession) => {
    const result = await setCurrent(session.id);
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    dispatch(sessionSelected(session.id));
    setNotice({ ok: `${session.label} is now the current session. Earlier sessions are read-only.` });
  };

  return (
    <div className="space-y-6">
      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Add a session</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">
            An academic year. New admissions, attendance, fees and exams are recorded in the current session.
          </CardDescription>
        </div>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField id="session-start" label="Starts" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <TextField id="session-end" label="Ends" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <TextField id="session-label" label="Name" value={label} readOnly placeholder="From the dates" hint="Named from the start and end years." />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FormStatus success={notice.ok} error={notice.error} />
            <Button type="submit" disabled={!label || addState.isLoading}>
              <Plus data-icon="inline-start" />
              Add session
            </Button>
          </div>
        </form>
      </Card>

      <Card className="gap-0 py-0">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">Sessions</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Past sessions stay available to look up from the session menu at the top of the page, but can&apos;t be changed.
          </p>
        </div>
        {sessions.length === 0 ? (
          <EmptyState icon={CalendarRange} title="No sessions yet" description="Add the current academic year above." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Session</TableHead>
                <TableHead className="hidden lg:table-cell">Dates</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((s) => {
                const status = statusOf(s, current);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="pl-5">
                      <p className="font-medium tabular-nums">{s.label}</p>
                      <p className="text-xs whitespace-normal text-muted-foreground lg:hidden">
                        {formatDate(s.startDate)} to {formatDate(s.endDate)}
                      </p>
                      <Badge variant={status.variant} className="mt-1 sm:hidden">
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {formatDate(s.startDate)} to {formatDate(s.endDate)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      {s.current ? null : (
                        <Button variant="outline" size="sm" onClick={() => makeCurrent(s)}>
                          Make current
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

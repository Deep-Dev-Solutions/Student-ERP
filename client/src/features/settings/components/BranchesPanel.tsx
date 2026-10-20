"use client";

import { useState } from "react";
import { Building2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, TextField } from "@/components/shared/FormFields";
import { useCurrentBranch, useTenantBranches } from "@/hooks/use-session";
import { errorMessage, useAddBranchMutation, useGetClassesQuery, useGetSectionsQuery } from "@/store/api";

export function BranchesPanel() {
  const branches = useTenantBranches();
  const { data: classes = [] } = useGetClassesQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const current = useCurrentBranch();
  const [addBranch, addState] = useAddBranchMutation();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});

  const countFor = (branchId: string) => {
    const classIds = new Set(classes.filter((c) => c.branchId === branchId).map((c) => c.id));
    return { classes: classIds.size, sections: sections.filter((s) => classIds.has(s.classId)).length };
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    const result = await addBranch({ name: name.trim(), code: code.trim().toUpperCase(), location: location.trim() });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ ok: `${result.data.name} added. Switch to it from the campus menu to set up its classes.` });
    setName("");
    setCode("");
    setLocation("");
  };

  return (
    <div className="space-y-6">
      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Add a campus</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Each campus has its own classes, staff, fees and reports.</CardDescription>
        </div>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <TextField id="branch-name" label="Campus name" placeholder="e.g. Model Town Campus" wrapperClassName="sm:col-span-2" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField id="branch-code" label="Code" placeholder="e.g. MT-05" maxLength={8} value={code} onChange={(e) => setCode(e.target.value)} />
            <TextField id="branch-location" label="Area" placeholder="e.g. Block C, Model Town" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FormStatus success={notice.ok} error={notice.error} idle={`${branches.length} campuses`} />
            <Button type="submit" disabled={!name.trim() || !code.trim() || addState.isLoading}>
              <Plus data-icon="inline-start" />
              Add campus
            </Button>
          </div>
        </form>
      </Card>

      <Card className="gap-0 py-0">
        <div className="border-b border-border p-5 sm:p-6">
          <h2 className="text-base font-semibold">Campuses</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Classes and sections are set up per campus in Classes and subjects.</p>
        </div>
        {branches.length === 0 ? (
          <EmptyState icon={Building2} title="No campuses yet" description="Add your first campus above." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Campus</TableHead>
                <TableHead className="hidden sm:table-cell">Code</TableHead>
                <TableHead className="hidden lg:table-cell">Area</TableHead>
                <TableHead className="pr-5 text-right">Classes and sections</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.map((b) => {
                const counts = countFor(b.id);
                return (
                  <TableRow key={b.id}>
                    <TableCell className="pl-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{b.name}</span>
                        {b.id === current?.id ? <Badge variant="info">Selected</Badge> : null}
                      </div>
                      <p className="text-xs text-muted-foreground sm:hidden">{b.code}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{b.code}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{b.location || "—"}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums">
                      {counts.classes} classes
                      <span className="block text-xs text-muted-foreground">{counts.sections} sections</span>
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

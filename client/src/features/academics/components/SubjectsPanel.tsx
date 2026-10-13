"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { FormStatus, SelectField, TextField } from "@/components/shared/FormFields";
import { classLabel, useBranchClasses } from "@/hooks/use-academics";
import {
  errorMessage,
  useAddSubjectMutation,
  useGetClassSubjectsQuery,
  useGetSubjectsQuery,
  useRemoveSubjectMutation,
  useSetClassSubjectMutation,
} from "@/store/api";

export function SubjectsPanel() {
  const classes = useBranchClasses();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  const [addSubject, addState] = useAddSubjectMutation();
  const [removeSubject] = useRemoveSubjectMutation();
  const [setClassSubject] = useSetClassSubjectMutation();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<{ ok?: string; error?: string }>({});
  const [pickedClassId, setPickedClassId] = useState<string>();
  const selectedClass = classes.find((c) => c.id === pickedClassId) ?? classes.find((c) => c.name === "Class 9") ?? classes[0];

  const classIds = new Set(classes.map((c) => c.id));
  const classesTaking = (subjectId: string) =>
    classSubjects.filter((cs) => cs.subjectId === subjectId && classIds.has(cs.classId)).length;
  const offering = (subjectId: string) =>
    classSubjects.find((cs) => cs.classId === selectedClass?.id && cs.subjectId === subjectId);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    const result = await addSubject({ name: name.trim(), code: code.trim().toUpperCase() });
    if ("error" in result) return setNotice({ error: errorMessage(result.error) });
    setNotice({ ok: `${result.data.name} added. Choose the classes that take it below.` });
    setName("");
    setCode("");
  };

  return (
    <div className="space-y-6">
      <Card className="gap-5 px-6">
        <div>
          <CardTitle>
            <h2>Add a subject</h2>
          </CardTitle>
          <CardDescription className="mt-0.5">Subjects are shared by every campus. Each class then picks the ones it teaches.</CardDescription>
        </div>
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField id="subject-name" label="Subject" placeholder="e.g. Geography" wrapperClassName="sm:col-span-2" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField id="subject-code" label="Short code" placeholder="e.g. GEO" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <FormStatus success={notice.ok} error={notice.error} idle={`${subjects.length} subjects`} />
            <Button type="submit" disabled={!name.trim() || !code.trim() || addState.isLoading}>
              <Plus data-icon="inline-start" />
              Add subject
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="gap-0 py-0">
          <div className="space-y-4 border-b border-border p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold">Subjects by class</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Tick what a class is taught. Electives are taken by some students only, and they get their own rosters.
              </p>
            </div>
            <SelectField
              id="subjects-class"
              label="Class"
              options={classes.map((c) => ({ value: c.id, label: classLabel(c, true) }))}
              value={selectedClass?.id ?? ""}
              onValueChange={setPickedClassId}
              className="sm:max-w-xs"
            />
          </div>
          {!selectedClass ? (
            <EmptyState icon={BookOpen} title="No classes at this campus yet" description="Add classes in the Classes and sections tab first." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Subject</TableHead>
                  <TableHead className="text-center">Taught</TableHead>
                  <TableHead className="pr-5 text-center">Elective</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => {
                  const entry = offering(s.id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="pl-5">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.code}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={Boolean(entry)}
                            onCheckedChange={(checked) =>
                              setClassSubject({ classId: selectedClass.id, subjectId: s.id, offered: checked, elective: false })
                            }
                            aria-label={`${selectedClass.name} is taught ${s.name}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="pr-5 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={entry?.elective ?? false}
                            disabled={!entry}
                            onCheckedChange={(checked) =>
                              setClassSubject({ classId: selectedClass.id, subjectId: s.id, offered: true, elective: checked })
                            }
                            aria-label={`${s.name} is an elective in ${selectedClass.name}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        <Card className="gap-0 py-0">
          <div className="border-b border-border p-5 sm:p-6">
            <h2 className="text-base font-semibold">Subject list</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Removing a subject takes it off every class.</p>
          </div>
          {subjects.length === 0 ? (
            <EmptyState icon={BookOpen} title="No subjects yet" description="Add the first subject above." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Subject</TableHead>
                  <TableHead>Classes here</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Remove</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((s) => {
                  const count = classesTaking(s.id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="pl-5">
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.code}</p>
                      </TableCell>
                      <TableCell>
                        {count === 0 ? <Badge variant="neutral">Not taught</Badge> : `${count} of ${classes.length}`}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeSubject(s.id)}
                          aria-label={`Remove ${s.name}`}
                          className="text-muted-foreground hover:bg-danger-tint hover:text-danger"
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

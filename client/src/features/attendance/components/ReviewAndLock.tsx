"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/StatCard";
import { statusVariant } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, ShieldCheck } from "lucide-react";
import { useGetClassLocksQuery } from "@/store/api";
import { ClassLockRecord } from "../types";
import { useReadOnly } from "@/hooks/use-academics";

interface ReviewAndLockProps {
  initialClasses?: ClassLockRecord[];
}

export function ReviewAndLock({
  initialClasses,
}: ReviewAndLockProps) {
  const readOnly = useReadOnly();
  const { data: classLocks = [] } = useGetClassLocksQuery();
  const [classes, setClasses] = useState<ClassLockRecord[]>(initialClasses ?? classLocks);

  const handleToggleLock = (classId: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === classId) {
          const isCurrentlyLocked = c.status === "locked";
          return {
            ...c,
            status: isCurrentlyLocked ? "pending" : "locked",
            lockedAt: isCurrentlyLocked ? undefined : "Just now by you",
          };
        }
        return c;
      })
    );
  };

  const handleLockAll = () => {
    setClasses((prev) =>
      prev.map((c) => ({
        ...c,
        status: "locked",
        lockedAt: c.lockedAt ?? "Just now by you",
      }))
    );
  };

  const lockedCount = classes.filter((c) => c.status === "locked").length;
  const pendingCount = classes.length - lockedCount;
  const presentTotal = classes.reduce((sum, c) => sum + c.present, 0);
  const enrolledTotal = classes.reduce((sum, c) => sum + c.totalStudents, 0);
  const rate = Math.round((presentTotal / enrolledTotal) * 1000) / 10;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Registers locked"
          value={`${lockedCount} of ${classes.length}`}
          footer={
            pendingCount > 0 ? (
              <Badge variant="highlight">{pendingCount} still open</Badge>
            ) : (
              <Badge variant="success">All locked</Badge>
            )
          }
        />
        <StatCard label="Present today" value={presentTotal} footer={`of ${enrolledTotal} enrolled`} />
        <StatCard label="Attendance rate" value={`${rate}%`} footer="Across these sections" />
        <StatCard label="Lock deadline" value="1:30 PM" footer="Registers lock automatically after this" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Class registers, classes 9 and 10</h2>
            <p className="text-sm text-muted-foreground">
              Check the counts, then lock each register so it can&apos;t be edited after the day ends.
            </p>
          </div>
          <Button onClick={handleLockAll} disabled={readOnly || pendingCount === 0}>
            <ShieldCheck data-icon="inline-start" />
            Lock all open registers
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Class</TableHead>
              <TableHead className="hidden xl:table-cell">Teacher</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Enrolled</TableHead>
              <TableHead className="text-right">Present</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Absent</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Leave</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {classes.map((cls) => {
              const name = `${cls.className}, ${cls.section}`;
              const locked = cls.status === "locked";
              return (
                <TableRow key={cls.id}>
                  <TableCell className="min-w-32 pl-5 whitespace-normal">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground xl:hidden">{cls.teacher}</p>
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">{cls.teacher}</TableCell>
                  <TableCell className="hidden text-right lg:table-cell">{cls.totalStudents}</TableCell>
                  <TableCell className="text-right">{cls.present}</TableCell>
                  <TableCell className="hidden text-right sm:table-cell">{cls.absent}</TableCell>
                  <TableCell className="hidden text-right lg:table-cell">{cls.leave}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-0.5">
                      <Badge variant={statusVariant(cls.status)}>{locked ? "Locked" : "Open"}</Badge>
                      {locked && cls.lockedAt ? (
                        <span className="hidden text-xs text-muted-foreground lg:block">{cls.lockedAt}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {locked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLock(cls.id)}
                        disabled={readOnly}
                        aria-label={`Unlock ${name}`}
                      >
                        <Unlock />
                        <span className="hidden lg:inline">Unlock</span>
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleToggleLock(cls.id)} disabled={readOnly} aria-label={`Lock ${name}`}>
                        <Lock />
                        <span className="hidden lg:inline">Lock</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

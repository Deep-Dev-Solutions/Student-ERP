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
import { ClassLockRecord } from "../types";

const defaultClasses: ClassLockRecord[] = [
  {
    id: "CLS-9A",
    className: "Class 9",
    section: "Section A",
    teacher: "Sir Rashid Minhas",
    totalStudents: 36,
    present: 33,
    absent: 2,
    leave: 1,
    status: "pending",
  },
  {
    id: "CLS-9B",
    className: "Class 9",
    section: "Section B",
    teacher: "Ms. Saima Akram",
    totalStudents: 35,
    present: 31,
    absent: 3,
    leave: 1,
    status: "locked",
    lockedAt: "9:05 AM by Ms. Saima",
  },
  {
    id: "CLS-10A",
    className: "Class 10",
    section: "Section A",
    teacher: "Mr. Tariq Jamil",
    totalStudents: 38,
    present: 36,
    absent: 2,
    leave: 0,
    status: "locked",
    lockedAt: "8:50 AM by Mr. Tariq",
  },
  {
    id: "CLS-10B",
    className: "Class 10",
    section: "Section B",
    teacher: "Ms. Nida Parveen",
    totalStudents: 34,
    present: 29,
    absent: 4,
    leave: 1,
    status: "locked",
    lockedAt: "9:20 AM by Ms. Nida",
  },
  {
    id: "CLS-10C",
    className: "Class 10",
    section: "Section C",
    teacher: "Sir Asif Mehmood",
    totalStudents: 32,
    present: 30,
    absent: 1,
    leave: 1,
    status: "pending",
  },
];

interface ReviewAndLockProps {
  initialClasses?: ClassLockRecord[];
}

export function ReviewAndLock({
  initialClasses = defaultClasses,
}: ReviewAndLockProps) {
  const [classes, setClasses] = useState<ClassLockRecord[]>(initialClasses);

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
          <Button onClick={handleLockAll} disabled={pendingCount === 0}>
            <ShieldCheck data-icon="inline-start" />
            Lock all open registers
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">Class</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead className="text-right">Enrolled</TableHead>
              <TableHead className="text-right">Present</TableHead>
              <TableHead className="text-right">Absent</TableHead>
              <TableHead className="text-right">Leave</TableHead>
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
                  <TableCell className="pl-5 font-medium">{name}</TableCell>
                  <TableCell>{cls.teacher}</TableCell>
                  <TableCell className="text-right">{cls.totalStudents}</TableCell>
                  <TableCell className="text-right">{cls.present}</TableCell>
                  <TableCell className="text-right">{cls.absent}</TableCell>
                  <TableCell className="text-right">{cls.leave}</TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-0.5">
                      <Badge variant={statusVariant(cls.status)}>{locked ? "Locked" : "Open"}</Badge>
                      {locked && cls.lockedAt ? (
                        <span className="text-xs text-muted-foreground">{cls.lockedAt}</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {locked ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleLock(cls.id)}
                        aria-label={`Unlock ${name}`}
                      >
                        <Unlock data-icon="inline-start" />
                        Unlock
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => handleToggleLock(cls.id)} aria-label={`Lock ${name}`}>
                        <Lock data-icon="inline-start" />
                        Lock
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

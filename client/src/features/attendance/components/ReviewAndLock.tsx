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
import { Card } from "@/components/ui/card";
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
    status: "locked",
    lockedAt: "08:45 AM by Principal",
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
    lockedAt: "09:05 AM by Ms. Saima",
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
    lockedAt: "08:50 AM by Mr. Tariq",
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
    status: "pending",
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
    status: "locked",
    lockedAt: "09:12 AM by Sir Asif",
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
            lockedAt: isCurrentlyLocked ? undefined : "Just now by You",
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
        lockedAt: "Now by Admin",
      }))
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Classes Reconciled
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              {classes.filter((c) => c.status === "locked").length} / {classes.length}
            </span>
            <span className="text-xs font-medium text-emerald-600">80% Locked</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Present Today
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">159</span>
            <span className="text-xs font-medium text-slate-500">of 175 Enrolled</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Overall Attendance
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">90.8%</span>
            <span className="text-xs font-medium text-emerald-600">+1.2% vs yesterday</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Lock Window Deadline
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">01:30 PM</span>
            <span className="text-xs font-medium text-amber-600">Closes in 45m</span>
          </div>
        </Card>
      </div>

      {/* Classes Table */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Classroom Verification Roster
            </h3>
            <p className="text-xs text-slate-500">
              Review class counts and lock entries to prevent unauthorized post-day modifications.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs h-8"
            onClick={handleLockAll}
          >
            <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
            Lock All Remaining Classes
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-slate-50/90 border-b border-slate-200/80">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-3.5 pl-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Class & Section
              </TableHead>
              <TableHead className="py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Assigned Teacher
              </TableHead>
              <TableHead className="py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total
              </TableHead>
              <TableHead className="py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Present
              </TableHead>
              <TableHead className="py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Absent
              </TableHead>
              <TableHead className="py-3.5 text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Leave
              </TableHead>
              <TableHead className="py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Lock Status
              </TableHead>
              <TableHead className="py-3.5 pr-5 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100">
            {classes.map((cls) => (
              <TableRow
                key={cls.id}
                className="hover:bg-slate-50/70 transition-colors"
              >
                {/* Class & Section */}
                <TableCell className="py-4 pl-5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 text-sm">
                      {cls.className} - {cls.section}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {cls.id}
                    </span>
                  </div>
                </TableCell>

                {/* Teacher */}
                <TableCell className="py-4">
                  <span className="text-xs font-medium text-slate-700">
                        {cls.teacher}
                  </span>
                </TableCell>

                {/* Total */}
                <TableCell className="py-4 text-center">
                  <span className="text-xs font-semibold text-slate-800">
                    {cls.totalStudents}
                  </span>
                </TableCell>

                {/* Present */}
                <TableCell className="py-4 text-center">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    {cls.present}
                  </span>
                </TableCell>

                {/* Absent */}
                <TableCell className="py-4 text-center">
                  <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                    {cls.absent}
                  </span>
                </TableCell>

                {/* Leave */}
                <TableCell className="py-4 text-center">
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    {cls.leave}
                  </span>
                </TableCell>

                {/* Status Badge (Dot-Style) */}
                <TableCell className="py-4">
                  {cls.status === "locked" ? (
                    <div className="flex flex-col">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 w-fit">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Locked
                      </span>
                      {cls.lockedAt && (
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {cls.lockedAt}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 w-fit">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Pending Lock
                    </span>
                  )}
                </TableCell>

                {/* Action Button */}
                <TableCell className="py-4 pr-5 text-right">
                  {cls.status === "locked" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleLock(cls.id)}
                      className="h-8 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <Unlock className="mr-1 h-3.5 w-3.5" />
                      Unlock
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleToggleLock(cls.id)}
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs"
                    >
                      <Lock className="mr-1 h-3.5 w-3.5" />
                      Lock Class
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}


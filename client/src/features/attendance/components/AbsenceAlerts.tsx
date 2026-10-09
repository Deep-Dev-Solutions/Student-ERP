"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Send,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Check,
  Clock,
  Phone,
} from "lucide-react";
import { StudentAttendanceRecord } from "../types";

const defaultAbsentStudents: StudentAttendanceRecord[] = [
  {
    id: "STD-1043",
    name: "Fatima Ali",
    email: "fatima.ali@student.edu",
    avatar: "FA",
    status: "A",
    remark: "Unannounced absence",
    guardianPhone: "0333-7654321",
  },
  {
    id: "STD-1049",
    name: "Usman Ghani",
    email: "usman.g@student.edu",
    avatar: "UG",
    status: "A",
    remark: "Sick - fever reported",
    guardianPhone: "0341-9988776",
  },
];

interface AbsenceAlertsProps {
  absentStudents?: StudentAttendanceRecord[];
}

export function AbsenceAlerts({
  absentStudents = defaultAbsentStudents,
}: AbsenceAlertsProps) {
  const [alertsSent, setAlertsSent] = useState(false);

  return (
    <div className="space-y-6">
      {/* Clean Alert Overview Card */}
      <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {absentStudents.length} Students Absent Today
                </h2>
                <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200/60">
                  Unexcused
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 max-w-xl leading-relaxed">
                Automated SMS and WhatsApp gateways are connected. Dispatching alerts will send a personalized notification directly to each student's registered guardian phone number.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Button
              onClick={() => setAlertsSent(true)}
              disabled={alertsSent || absentStudents.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs h-10 px-5 text-xs font-semibold"
            >
              <Send className="mr-2 h-4 w-4" />
              {alertsSent ? "Alerts Successfully Dispatched" : "Send Bulk WhatsApp Alerts"}
            </Button>
          </div>
        </div>

        {alertsSent && (
          <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200/80 p-3 flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Dispatched {absentStudents.length} WhatsApp notifications via Cloud API gateway at{" "}
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Delivery receipts logged in Audit Trail.
            </span>
          </div>
        )}
      </Card>

      {/* WhatsApp Template Preview & Absentee Roster Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Template Preview Card (1 Column) */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              WhatsApp Template Preview
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Pre-configured transactional message template.
            </CardDescription>
          </div>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-emerald-200/80 bg-[#e7f8ef] p-4 text-xs text-slate-800 shadow-xs relative">
              <div className="flex items-center gap-2 font-bold text-emerald-800 mb-2">
                <span>EduCore ERP • Attendance Notice</span>
              </div>
              <p className="leading-relaxed">
                "Respected Parent, your child{" "}
                <span className="font-semibold text-emerald-900 bg-emerald-100/80 px-1 rounded">
                  [Student Name]
                </span>{" "}
                (Class 9-A) has been marked{" "}
                <span className="font-bold text-rose-700">ABSENT</span> on{" "}
                <span className="font-medium">09-Oct-2026</span> without prior written notice.
              </p>
              <p className="mt-2 text-slate-600 leading-relaxed">
                Please contact the branch administration immediately if this absence is in error."
              </p>
              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-emerald-200/60">
                <span>Sender: EduCore High</span>
                <span className="flex items-center gap-1 font-semibold text-emerald-700">
                  <Check className="h-3 w-3" /> WhatsApp Verified
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-200/70">
              <span className="font-semibold text-slate-700 block mb-0.5">
                Delivery Rules
              </span>
              SMS fallback is enabled automatically if the recipient’s WhatsApp number is unreachable.
            </div>
          </div>
        </Card>

        {/* Absentee Student List (2 Columns) */}
        <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">
                Today's Absentee List ({absentStudents.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Individual contact records targeted for notification dispatch.
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-blue-600">
              Class 9 & 10
            </span>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {absentStudents.map((student) => (
              <div
                key={student.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-xs font-semibold text-rose-700 ring-1 ring-rose-500/10">
                    {student.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {student.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {student.id}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {student.remark || "No reason logged"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-mono">{student.guardianPhone}</span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      alertsSent
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {alertsSent ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" /> Sent
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 text-slate-400" /> Pending
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}


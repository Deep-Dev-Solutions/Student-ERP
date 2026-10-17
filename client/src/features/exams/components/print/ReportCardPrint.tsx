"use client";

import { useSyncExternalStore } from "react";
import { Award } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { PrintToolbar } from "@/features/students/components/print/PrintToolbar";
import { SchoolLetterhead } from "@/features/students/components/print/SchoolLetterhead";
import { primaryGuardian } from "@/features/students/status";
import { useGrader } from "@/hooks/use-academics";
import { computeResults, ordinal, sectionRoster, type StudentResult } from "@/lib/results";
import {
  useGetClassesQuery,
  useGetClassSubjectsQuery,
  useGetExamMarksQuery,
  useGetExamPapersQuery,
  useGetExamsQuery,
  useGetSectionsQuery,
  useGetStudentsQuery,
  useGetSubjectsQuery,
} from "@/store/api";
import { formatDateRange } from "../ExamSetup";

const noSubscribe = () => () => {};

/** Report cards for one student, a section, or a whole class: ?exam=…&student=… | &section=… | &class=… */
export function ReportCardPrint() {
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  const params = new URLSearchParams(search);
  const { data: exams = [] } = useGetExamsQuery();
  const { data: papers = [] } = useGetExamPapersQuery();
  const { data: marks = [] } = useGetExamMarksQuery();
  const { data: students = [] } = useGetStudentsQuery();
  const { data: classSubjects = [] } = useGetClassSubjectsQuery();
  const { data: sections = [] } = useGetSectionsQuery();
  const { data: classes = [] } = useGetClassesQuery();
  const exam = exams.find((e) => e.id === params.get("exam"));
  const one = students.find((s) => s.id === params.get("student"));
  const classId = one?.classId ?? params.get("class") ?? sections.find((s) => s.id === params.get("section"))?.classId;

  if (!search) return null;
  if (!exam || !classId) {
    return <EmptyState icon={Award} title="We couldn't find these report cards" description="The exam or class may have been removed." action={<ButtonLink href="/exams?tab=results">Back to results</ButtonLink>} />;
  }

  // Rank against the whole class, and within each section.
  const classSections = sections.filter((s) => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name));
  const classPapers = papers.filter((p) => p.examId === exam.id && p.classId === classId).sort((a, b) => a.date.localeCompare(b.date));
  const bySection = new Map(classSections.map((s) => [s.id, computeResults(sectionRoster(students, s.id), classPapers, marks, classSubjects)]));
  const classResults = computeResults(classSections.flatMap((s) => sectionRoster(students, s.id)), classPapers, marks, classSubjects);
  const wanted = classResults.filter((r) => (one ? r.student.id === one.id : !params.get("section") || r.student.sectionId === params.get("section")));
  const backHref = one ? `/students/${one.id}?tab=results` : "/exams?tab=results";

  return (
    <>
      <PrintToolbar backHref={backHref} backLabel={one ? "Back to student" : `Back to results (${wanted.length} report cards)`} />
      <div className="mx-auto max-w-[210mm] p-6 sm:p-10 print:max-w-none print:p-0">
        {wanted.length === 0 ? <EmptyState icon={Award} title="No report cards to print" description="This section has no active students." /> : null}
        {wanted.map((r) => {
          const inSection = bySection.get(r.student.sectionId)?.find((x) => x.student.id === r.student.id);
          return (
            <ReportCard
              key={r.student.id}
              result={r}
              rollNo={inSection?.rollNo ?? r.rollNo}
              sectionPosition={inSection?.position ?? null}
              sectionSize={bySection.get(r.student.sectionId)?.length ?? 0}
              classSize={classResults.length}
              examTitle={exam.title}
              examDates={formatDateRange(exam.startDate, exam.endDate)}
              published={Boolean(exam.publishedAt)}
              className={classes.find((c) => c.id === classId)?.name ?? ""}
              sectionName={sections.find((s) => s.id === r.student.sectionId)?.name ?? ""}
            />
          );
        })}
      </div>
    </>
  );
}

function ReportCard(props: {
  result: StudentResult;
  rollNo: string;
  sectionPosition: number | null;
  sectionSize: number;
  classSize: number;
  examTitle: string;
  examDates: string;
  published: boolean;
  className: string;
  sectionName: string;
}) {
  const { result: r } = props;
  const grade = useGrader();
  const { data: subjects = [] } = useGetSubjectsQuery();
  const overall = r.percent !== null ? grade(r.percent) : null;
  const details: [string, string][] = [
    ["Student", `${r.student.name} (${r.student.id})`],
    ["Class", `${props.className}, section ${props.sectionName}, roll ${props.rollNo}`],
    ["Father or guardian", primaryGuardian(r.student)?.name ?? ""],
    ["Attendance this term", `${r.student.attendance}%`],
  ];
  const summary: [string, string][] = [
    ["Marks", `${r.obtained} out of ${r.total}`],
    ["Percentage", r.percent !== null ? `${r.percent}%` : "Not complete"],
    ["Grade", overall?.label ?? "—"],
    ["Result", r.result === "pass" ? "Pass" : r.result === "fail" ? `Fail (${r.failedIn.map((id) => subjects.find((s) => s.id === id)?.name).join(", ")})` : "Not complete"],
    ["Position in section", props.sectionPosition ? `${ordinal(props.sectionPosition)} of ${props.sectionSize}` : "—"],
    ["Position in class", r.position ? `${ordinal(r.position)} of ${props.classSize}` : "—"],
  ];

  return (
    <article className="relative space-y-5 py-8 text-sm break-after-page first:pt-0 print:py-0">
      {!props.published ? (
        <p aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-5xl font-bold text-warning/20">PROVISIONAL</p>
      ) : null}
      <SchoolLetterhead
        title="Report card"
        meta={
          <>
            {props.examTitle}
            <br />
            {props.examDates}
          </>
        }
      />
      <dl className="grid grid-cols-1 gap-x-8 gap-y-1.5 sm:grid-cols-2 print:grid-cols-2">
        {details.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-border pb-1">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-foreground/60">
            <th className="py-1.5 pr-2 font-semibold">Subject</th>
            <th className="px-2 py-1.5 text-right font-semibold">Total</th>
            <th className="px-2 py-1.5 text-right font-semibold">Pass</th>
            <th className="px-2 py-1.5 text-right font-semibold">Obtained</th>
            <th className="px-2 py-1.5 text-center font-semibold">Grade</th>
            <th className="py-1.5 pl-2 font-semibold">Remark</th>
          </tr>
        </thead>
        <tbody>
          {r.subjects.map((s) => {
            const pct = s.obtained !== null ? Math.round((s.obtained / s.paper.totalMarks) * 100) : null;
            return (
              <tr key={s.paper.id} className="border-b border-border">
                <td className="py-1.5 pr-2">{subjects.find((x) => x.id === s.paper.subjectId)?.name}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{s.paper.totalMarks}</td>
                <td className="px-2 py-1.5 text-right tabular-nums">{s.paper.passMarks}</td>
                <td className={`px-2 py-1.5 text-right tabular-nums ${s.mark && !s.passed ? "font-semibold text-danger" : ""}`}>
                  {!s.mark ? "—" : s.mark.absent ? "Absent" : s.obtained}
                </td>
                <td className="px-2 py-1.5 text-center">{pct !== null ? grade(pct).label : "—"}</td>
                <td className="py-1.5 pl-2 text-muted-foreground">{s.mark?.remark ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 rounded-lg border border-foreground/30 p-3 sm:grid-cols-3 print:grid-cols-3">
        {summary.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid grid-cols-3 gap-8 pt-12 text-xs text-muted-foreground">
        <p className="border-t border-foreground/40 pt-1">Class teacher</p>
        <p className="border-t border-foreground/40 pt-1 text-center">Principal</p>
        <p className="border-t border-foreground/40 pt-1 text-right">Parent or guardian</p>
      </div>
    </article>
  );
}

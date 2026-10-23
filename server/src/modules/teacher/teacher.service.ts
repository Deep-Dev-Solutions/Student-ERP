import { Injectable } from "@nestjs/common";
import { currentContext } from "../../common/context";
import { parseDay, todayInSchool } from "../../common/shapes";
import { PrismaService } from "../../common/prisma/prisma.service";

const DAY_MS = 86_400_000;

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * getTeacherDay: pendingTasks is computed from real data (unmarked attendance,
   * ungraded exam marks). todayClasses is always empty — nothing in this project
   * tracks a period-by-period timetable (room, time slot, day of week), so there's
   * no real schedule to report rather than a fabricated one.
   */
  async day() {
    const ctx = currentContext();
    const staffId = ctx.staffId;
    if (!staffId) return { todayClasses: [], pendingTasks: [], teacherSummary: { name: ctx.userName ?? "", students: 0 } };

    const today = todayInSchool();
    const [member, sections, allocations] = await Promise.all([
      this.prisma.tenant.staffMember.findFirst({ where: { staffId } }),
      this.prisma.tenant.section.findMany({ where: { inchargeId: staffId }, include: { class: true } }),
      this.prisma.tenant.teacherAllocation.findMany({ where: { teacherId: staffId } }),
    ]);

    const pendingTasks = [];

    for (const section of sections) {
      const register = await this.prisma.tenant.attendanceRegister.findFirst({ where: { sectionId: section.id, date: parseDay(today), subjectId: null } });
      if (!register) {
        pendingTasks.push({
          id: `task-att-${section.id}`,
          type: "attendance",
          title: `Mark attendance for ${section.class.name}, section ${section.name}`,
          description: "Today's register hasn't been submitted yet.",
          urgency: "high",
          actionLabel: "Mark attendance",
          actionHref: "/teacher-portal/attendance",
        });
      }
    }

    // classId is grade-level, so several section allocations can share the same class+subject pair.
    const taught = [...new Map(allocations.map((a) => [`${a.classId}:${a.subjectId}`, a])).values()];

    if (taught.length) {
      const exams = await this.prisma.tenant.exam.findMany({ where: { publishedAt: null, classIds: { hasSome: taught.map((a) => a.classId) } } });
      const subjects = await this.prisma.tenant.subject.findMany({ where: { id: { in: taught.map((a) => a.subjectId) } } });
      const classes = await this.prisma.tenant.schoolClass.findMany({ where: { id: { in: taught.map((a) => a.classId) } } });
      const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? "the subject";
      const className = (id: string) => classes.find((c) => c.id === id)?.name ?? "the class";

      for (const exam of exams) {
        for (const a of taught.filter((x) => exam.classIds.includes(x.classId))) {
          const paper = await this.prisma.tenant.examPaper.findFirst({ where: { examId: exam.id, classId: a.classId, subjectId: a.subjectId } });
          if (!paper) continue;
          const students = await this.prisma.tenant.student.findMany({ where: { classId: a.classId, enrollment: "active" }, select: { id: true } });
          const marked = await this.prisma.tenant.examMark.count({ where: { examId: exam.id, subjectId: a.subjectId, studentId: { in: students.map((s) => s.id) } } });
          const remaining = students.length - marked;
          if (remaining <= 0) continue;
          const daysLeft = Math.ceil((exam.endDate.getTime() - parseDay(today).getTime()) / DAY_MS);
          pendingTasks.push({
            id: `task-mk-${exam.id}-${a.subjectId}-${a.classId}`,
            type: "marks",
            title: `Enter ${exam.title} ${subjectName(a.subjectId)} marks`,
            description: `${remaining} answer sheet${remaining === 1 ? "" : "s"} left for ${className(a.classId)} before marks are locked.`,
            urgency: daysLeft <= 3 ? "high" : "medium",
            actionLabel: "Enter marks",
            actionHref: "/teacher-portal/marks",
          });
        }
      }
    }

    const classIds = [...new Set(allocations.map((a) => a.classId))];
    const students = classIds.length ? await this.prisma.tenant.student.count({ where: { classId: { in: classIds }, enrollment: "active" } }) : 0;

    return { todayClasses: [], pendingTasks, teacherSummary: { name: member?.name ?? ctx.userName ?? "", students } };
  }
}

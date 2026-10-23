import { Injectable } from "@nestjs/common";
import { voucherBalance, voucherState } from "../../domain/fees";
import { todayInSchool } from "../../common/shapes";
import { PrismaService } from "../../common/prisma/prisma.service";

type Mark = { status: string };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The campus shown when nothing more specific is picked. There's no "primary campus"
   * flag on Branch and no way yet for a Server Component to read the client's selected
   * branch (a Redux-only value, defaulted there to a hardcoded "br-1"), so this is a
   * best-effort tie-breaker for a single-campus school rather than a real equivalent of
   * that default; multi-campus dashboard switching needs a later phase.
   */
  private async firstBranch() {
    return this.prisma.tenant.branch.findFirstOrThrow({ orderBy: { id: "asc" } });
  }

  /** One day's register rows for a branch, daily (not subject-wise) registers only. */
  private async dailyRegisters(branchId: string, date: string) {
    return this.prisma.tenant.attendanceRegister.findMany({ where: { branchId, date: new Date(`${date}T00:00:00.000Z`), subjectId: null } });
  }

  private async sectionsAndEnrolment(branchId: string) {
    const classes = await this.prisma.tenant.schoolClass.findMany({ where: { branchId }, select: { id: true, name: true } });
    const classIds = classes.map((c) => c.id);
    const sections = await this.prisma.tenant.section.findMany({ where: { classId: { in: classIds } } });
    const students = await this.prisma.tenant.student.findMany({ where: { branchId, enrollment: "active" }, select: { sectionId: true } });
    const enrolled = new Map<string, number>();
    for (const s of students) enrolled.set(s.sectionId, (enrolled.get(s.sectionId) ?? 0) + 1);
    const classNameOf = new Map(classes.map((c) => [c.id, c.name]));
    return { sections, enrolled, classNameOf };
  }

  /** getRegisterSummary */
  async registerSummary() {
    const { id: branchId } = await this.firstBranch();
    const today = todayInSchool();
    const { sections, enrolled } = await this.sectionsAndEnrolment(branchId);
    const registers = await this.dailyRegisters(branchId, today);

    let locked = 0;
    let pending = 0;
    let notMarked = 0;
    let present = 0;
    let enrolledInMarked = 0;
    for (const section of sections) {
      const register = registers.find((r) => r.sectionId === section.id);
      const sectionEnrolled = enrolled.get(section.id) ?? 0;
      if (!register) {
        notMarked++;
        continue;
      }
      if (register.lockedAt) locked++;
      else pending++;
      const marks = register.marks as Record<string, Mark>;
      present += Object.values(marks).filter((m) => m.status === "present").length;
      enrolledInMarked += sectionEnrolled;
    }
    return {
      sections: sections.length,
      locked,
      pending,
      notMarked,
      present,
      enrolledInMarked,
      rate: enrolledInMarked > 0 ? Math.round((present / enrolledInMarked) * 1000) / 10 : 0,
    };
  }

  /** getAttendanceTrend: the last 22 school days that have a register. */
  async attendanceTrend() {
    const { id: branchId } = await this.firstBranch();
    const { enrolled } = await this.sectionsAndEnrolment(branchId);
    const dateRows = await this.prisma.tenant.attendanceRegister.findMany({
      where: { branchId, subjectId: null },
      distinct: ["date"],
      orderBy: { date: "desc" },
      take: 22,
      select: { date: true },
    });
    const dates = dateRows.map((r) => r.date).sort((a, b) => a.getTime() - b.getTime());

    const trend = [];
    for (const date of dates) {
      const registers = await this.prisma.tenant.attendanceRegister.findMany({ where: { branchId, subjectId: null, date } });
      let present = 0;
      let total = 0;
      for (const register of registers) {
        const marks = register.marks as Record<string, Mark>;
        present += Object.values(marks).filter((m) => m.status === "present").length;
        total += enrolled.get(register.sectionId) ?? 0;
      }
      trend.push({ date: date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Karachi" }), rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0 });
    }
    return trend;
  }

  /** getFeeTarget */
  async feeTarget() {
    const { id: branchId } = await this.firstBranch();
    const today = todayInSchool();
    const month = today.slice(0, 7);
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

    const [dueThisMonth, payments, openVouchers] = await Promise.all([
      this.prisma.tenant.feeVoucher.findMany({ where: { branchId, month }, select: { totalAmount: true } }),
      this.prisma.tenant.payment.findMany({ where: { branchId, at: { gte: monthStart, lt: monthEnd } }, select: { amount: true, reversed: true } }),
      this.prisma.tenant.feeVoucher.findMany({ where: { branchId, status: { in: ["unpaid", "partial"] } }, select: { totalAmount: true, paidAmount: true, status: true, dueDate: true } }),
    ]);

    const overdue = openVouchers.filter((v) => voucherState({ ...v, dueDate: v.dueDate.toISOString().slice(0, 10) }, today) === "overdue");
    return {
      month: new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString("en-US", { month: "long", timeZone: "UTC" }),
      collected: payments.filter((p) => !p.reversed).reduce((n, p) => n + p.amount, 0),
      target: dueThisMonth.reduce((n, v) => n + v.totalAmount, 0),
      overdueAmount: overdue.reduce((n, v) => n + voucherBalance(v), 0),
      overdueVouchers: overdue.length,
    };
  }

  /** getFeeCollection: the last 7 calendar months, the current one to date. */
  async feeCollection() {
    const { id: branchId } = await this.firstBranch();
    const currentMonth = todayInSchool().slice(0, 7);
    const months: { month: string; start: Date; end: Date; current: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(`${currentMonth}-01T00:00:00.000Z`);
      d.setUTCMonth(d.getUTCMonth() - i);
      const start = new Date(d);
      const end = new Date(d);
      end.setUTCMonth(end.getUTCMonth() + 1);
      months.push({ month: start.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }), start, end, current: i === 0 });
    }

    const collection = [];
    for (const m of months) {
      const payments = await this.prisma.tenant.payment.findMany({ where: { branchId, at: { gte: m.start, lt: m.end } }, select: { amount: true, reversed: true } });
      collection.push({ month: m.month, collected: payments.filter((p) => !p.reversed).reduce((n, p) => n + p.amount, 0), ...(m.current ? { current: true } : {}) });
    }
    return collection;
  }

  /** getStudentsSummary */
  async studentsSummary() {
    const { id: branchId } = await this.firstBranch();
    const month = todayInSchool().slice(0, 7);
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

    const [total, admittedThisMonth] = await Promise.all([
      this.prisma.tenant.student.count({ where: { branchId, enrollment: "active" } }),
      this.prisma.tenant.student.count({ where: { branchId, enrollment: "active", admissionDate: { gte: monthStart, lt: monthEnd } } }),
    ]);
    return { total, admittedThisMonth };
  }
}

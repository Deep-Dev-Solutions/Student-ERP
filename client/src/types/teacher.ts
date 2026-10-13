export interface ScheduledClass {
  id: string;
  time: string;
  period: string;
  className: string;
  section: string;
  subject: string;
  room: string;
  attendanceMarked: boolean;
  status: "completed" | "current" | "upcoming";
}

export interface PendingTaskItem {
  id: string;
  type: "attendance" | "marks" | "syllabus";
  title: string;
  description: string;
  urgency: "high" | "medium";
  actionLabel: string;
  actionHref: string;
}

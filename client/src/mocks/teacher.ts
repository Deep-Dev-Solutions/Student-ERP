import type { PendingTaskItem, ScheduledClass } from "@/types";

/** Demo data for the teacher portal home. Read it through @/store/api. */
export const todayClasses: ScheduledClass[] = [
  {
    id: "cls-1",
    time: "8:30 – 9:15 AM",
    period: "Period 1",
    className: "Class 9",
    section: "Section A",
    subject: "Physics",
    room: "Lab 02",
    attendanceMarked: true,
    status: "completed",
  },
  {
    id: "cls-2",
    time: "9:20 – 10:05 AM",
    period: "Period 2",
    className: "Class 10",
    section: "Section B",
    subject: "Physics",
    room: "Room 104",
    attendanceMarked: false,
    status: "current",
  },
  {
    id: "cls-3",
    time: "10:30 – 11:15 AM",
    period: "Period 3",
    className: "Class 8",
    section: "Section C",
    subject: "General Science",
    room: "Room 108",
    attendanceMarked: false,
    status: "upcoming",
  },
  {
    id: "cls-4",
    time: "11:20 AM – 12:05 PM",
    period: "Period 4",
    className: "Class 10",
    section: "Section A",
    subject: "Physics practical",
    room: "Physics Lab",
    attendanceMarked: false,
    status: "upcoming",
  },
];

export const pendingTasks: PendingTaskItem[] = [
  {
    id: "task-1",
    type: "attendance",
    title: "Mark attendance for class 10-B",
    description: "Period 2 ends at 10:05 AM. Submit the register before the office locks it.",
    urgency: "high",
    actionLabel: "Mark attendance",
    actionHref: "/teacher-portal/attendance",
  },
  {
    id: "task-2",
    type: "marks",
    title: "Enter mid-term physics marks",
    description: "14 answer sheets left for class 9-A before marks are locked.",
    urgency: "medium",
    actionLabel: "Enter marks",
    actionHref: "/teacher-portal/marks",
  },
];

export const teacherSummary = {
  name: "Dr. Tariq",
  students: 142,
};

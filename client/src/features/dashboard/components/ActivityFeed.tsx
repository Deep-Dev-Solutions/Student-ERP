import { CalendarCheck, FileStack, UserPlus, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { studentsSummary, todayRegister } from "@/services/dashboard";
import { formatNumber } from "@/lib/format";

const nineB = todayRegister.find((s) => s.section === "9-B")!;

interface ActivityItem {
  id: string;
  title: string;
  description: React.ReactNode;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
}

const recentActivities: ActivityItem[] = [
  {
    id: "act-1",
    title: "Fee collected",
    description: (
      <>
        <span className="font-medium text-foreground">Ali (Accountant)</span> collected Rs 3,000
        in cash for student #1042, Ahmed Khan.
      </>
    ),
    time: "10 min ago",
    icon: Wallet,
  },
  {
    id: "act-2",
    title: "Attendance locked",
    description: (
      <>
        <span className="font-medium text-foreground">Usman (Principal)</span> locked the class 9-B
        register: {nineB.present} present,{" "}
        {nineB.enrolled - nineB.present} absent.
      </>
    ),
    time: "1 hr ago",
    icon: CalendarCheck,
  },
  {
    id: "act-3",
    title: "Student admitted",
    description: (
      <>
        <span className="font-medium text-foreground">Admin</span> admitted Zainab Bilal to class
        10-B. Her first fee voucher was generated.
      </>
    ),
    time: "3 hr ago",
    icon: UserPlus,
  },
  {
    id: "act-4",
    title: "Monthly vouchers generated",
    description: (
      <>
        {formatNumber(studentsSummary.total)} fee vouchers were generated for the October
        billing cycle.
      </>
    ),
    time: "Yesterday",
    icon: FileStack,
  },
];

export function ActivityFeed() {
  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div>
        <h2 className="text-base font-semibold">Recent activity</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Actions taken at this campus</p>
      </div>

      <ol className="space-y-4">
        {recentActivities.map(({ id, title, description, time, icon: Icon }) => (
          <li key={id} className="flex gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Icon aria-hidden className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-medium">{title}</p>
                <span className="shrink-0 text-xs text-muted-foreground">{time}</span>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

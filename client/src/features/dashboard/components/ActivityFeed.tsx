import {
  Card,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";

interface ActivityLogItem {
  id: string;
  title: string;
  description: React.ReactNode;
  time: string;
  indicatorColor: string;
}

const recentActivities: ActivityLogItem[] = [
  {
    id: "act-1",
    title: "Fee Collected",
    description: (
      <>
        <span className="font-medium text-slate-800">Ali (Accountant)</span>{" "}
        collected Rs 3,000 via Cash for Student #1042 (Ahmed Khan).
      </>
    ),
    time: "10m ago",
    indicatorColor: "bg-blue-600",
  },
  {
    id: "act-2",
    title: "Attendance Locked",
    description: (
      <>
        <span className="font-medium text-slate-800">Usman (Principal)</span>{" "}
        verified and locked Class 9-A attendance record (34 present, 2 absent).
      </>
    ),
    time: "1h ago",
    indicatorColor: "bg-emerald-500",
  },
  {
    id: "act-3",
    title: "New Student Registered",
    description: (
      <>
        <span className="font-medium text-slate-800">Admin</span> registered{" "}
        Zainab Bilal into Class 10-B. Voucher generated automatically.
      </>
    ),
    time: "3h ago",
    indicatorColor: "bg-indigo-500",
  },
  {
    id: "act-4",
    title: "Monthly Fee Vouchers Generated",
    description: (
      <>
        System generated 1,245 fee challans for the November billing cycle.
      </>
    ),
    time: "Yesterday",
    indicatorColor: "bg-slate-400",
  },
];

export function ActivityFeed() {
  return (
    <Card className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <CardTitle className="text-base font-bold text-slate-900">
            Recent Activity Log
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Audit trail of administrative actions across this branch.
          </CardDescription>
        </div>
        <span className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer">
          View all
        </span>
      </div>

      {/* Timeline UI with Continuous Stem */}
      <div className="mt-5 relative pl-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-2 before:w-0.5 before:bg-slate-200">
        {recentActivities.map((activity) => (
          <div key={activity.id} className="relative group">
            <div
              className={`absolute -left-6 top-1 h-2.5 w-2.5 rounded-full ${activity.indicatorColor} ring-4 ring-white`}
            />
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {activity.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                  {activity.description}
                </p>
              </div>
              <span className="text-[11px] font-medium text-slate-400 shrink-0">
                {activity.time}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}


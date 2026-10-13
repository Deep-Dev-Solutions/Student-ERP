import {
  CalendarCheck,
  ClipboardList,
  FileText,
  IdCard,
  LayoutDashboard,
  Settings,
  UsersRound,
  Wallet,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Match only this exact path (for section home pages). */
  exact?: boolean;
  /** Count of items needing action, shown with the highlighter. */
  pending?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
  {
    label: "Daily",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/attendance", label: "Attendance", icon: CalendarCheck, pending: 3 },
      { href: "/fees", label: "Fee collection", icon: Wallet },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/students", label: "Students", icon: UsersRound },
      { href: "/staff", label: "Staff & HR", icon: IdCard },
    ],
  },
  {
    label: "Academics",
    items: [{ href: "/exams", label: "Exams & marks", icon: ClipboardList }],
  },
  {
    label: "Admin",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

export const teacherNavGroups: NavGroup[] = [
  {
    label: "Teaching",
    items: [
      { href: "/teacher-portal", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/teacher-portal/attendance", label: "Mark attendance", icon: CalendarCheck },
      { href: "/teacher-portal/marks", label: "Marks & grades", icon: ClipboardList },
      { href: "/teacher-portal/paper-maker", label: "Paper maker", icon: FileText },
    ],
  },
];

/** Labels for nested routes that are not nav items themselves. */
const subPageLabels: Record<string, string> = {
  "/teacher-portal/paper-maker/generate": "Generate paper",
};

export function isNavItemActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export interface Crumb {
  label: string;
  href?: string;
}

export function getBreadcrumbs(pathname: string, groups: NavGroup[]): Crumb[] {
  for (const group of groups) {
    const item = group.items.find((i) => isNavItemActive(pathname, i));
    if (!item) continue;

    const crumbs: Crumb[] = [{ label: group.label }, { label: item.label, href: item.href }];
    const subLabel = subPageLabels[pathname];
    if (subLabel) crumbs.push({ label: subLabel });
    return crumbs;
  }
  return [];
}

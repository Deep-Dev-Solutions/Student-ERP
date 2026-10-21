"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, ChevronDown, CreditCard, LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/use-session";
import { canAccessPath } from "@/lib/auth/permissions";
import { type ThemeChoice, useTheme } from "@/lib/theme";
import { clearSessionCookie } from "@/lib/auth/session-cookie";
import { API_MODE } from "@/lib/api-mode";
import { useAppDispatch } from "@/store/hooks";
import { signedOut } from "@/store/sessionSlice";
import type { User } from "@/types";

export interface ProfileUser {
  name: string;
  email: string;
  role: string;
  initials: string;
  avatarUrl?: string;
}

export interface ProfileLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const defaultLinks: ProfileLink[] = [
  { href: "/console", label: "Platform console", icon: Building2 },
  { href: "/settings", label: "Account settings", icon: Settings },
  { href: "/fees", label: "Billing & subscriptions", icon: CreditCard },
];

const itemClass =
  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium cursor-pointer";

interface UserProfileNavProps {
  /** Who to show; defaults to the signed-in user. */
  user?: ProfileUser;
  links?: ProfileLink[];
}

export function toProfileUser(user: User): ProfileUser {
  return { name: user.name, email: user.email, role: user.title, initials: user.initials, avatarUrl: user.avatarUrl };
}

const themeOptions: { value: ThemeChoice; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Same as device", icon: Monitor },
];

export function UserProfileNav({ user: userProp, links = defaultLinks }: UserProfileNavProps) {
  const dispatch = useAppDispatch();
  const currentUser = useCurrentUser();
  const user = userProp ?? (currentUser ? toProfileUser(currentUser) : undefined);
  const [theme, setTheme] = useTheme();
  if (!user) return null;
  const visibleLinks = currentUser ? links.filter((l) => canAccessPath(currentUser.role, l.href)) : links;

  const signOut = () => {
    // In API mode the better-auth session is ended on the server too.
    if (API_MODE) void fetch("/api/auth/sign-out", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" });
    clearSessionCookie();
    dispatch(signedOut());
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={`Account menu for ${user.name}`}
        className="group flex items-center gap-2 rounded-full p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <Avatar className="size-9">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
            {user.initials}
          </AvatarFallback>
        </Avatar>
        <span className="hidden flex-col items-start pr-1 text-left leading-tight lg:flex">
          <span className="text-sm font-medium">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.role}</span>
        </span>
        <ChevronDown className="hidden size-3.5 text-muted-foreground transition-transform duration-200 group-data-[popup-open]:rotate-180 lg:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={6} className="w-64 p-1.5">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>

        <DropdownMenuSeparator />

        {visibleLinks.map(({ href, label, icon: Icon }) => (
          <DropdownMenuItem key={href} render={<Link href={href} className={itemClass} />}>
            <Icon className="size-4 text-muted-foreground" />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2.5 text-xs text-muted-foreground">Theme</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as ThemeChoice)}>
            {themeOptions.map(({ value, label, icon: Icon }) => (
              <DropdownMenuRadioItem key={value} value={value} className={itemClass}>
                <Icon className="size-4 text-muted-foreground" />
                <span>{label}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={signOut} render={<Link href="/login" className={itemClass} />}>
          <LogOut className="size-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

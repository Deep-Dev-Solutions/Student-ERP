"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { landingPath } from "@/lib/auth/permissions";
import { API_MODE } from "@/lib/api-mode";
import { writeSessionCookie } from "@/lib/auth/session-cookie";
import { DEFAULT_USER_ID } from "@/mocks/users";
import { useGetUsersQuery } from "@/store/api";
import { useAppDispatch } from "@/store/hooks";
import { signedIn } from "@/store/sessionSlice";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const { data: users = [] } = useGetUsersQuery();

  const goOn = (role: Parameters<typeof landingPath>[0]) => {
    // Return to the page that sent the user here, if it's a path on this site.
    const next = new URLSearchParams(window.location.search).get("next");
    router.push(next?.startsWith("/") && !next.startsWith("//") ? next : landingPath(role));
  };

  /** API mode: sign in with better-auth, then ask the API who this is. */
  const signInWithApi = async (form: FormData) => {
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email")).trim().toLowerCase(), password: String(form.get("password")) }),
    }).catch(() => null);
    if (!res?.ok) {
      setSubmitting(false);
      return setError(res ? "That email and password don't match. Check them and try again." : "Can't reach the server. Check your connection.");
    }
    const me = await fetch("/api/me", { credentials: "include" }).then((r) => r.json()).catch(() => null);
    if (!me?.user) {
      setSubmitting(false);
      return setError(
        me?.memberships?.some((m: { status: string }) => m.status === "disabled")
          ? "This account's access has been turned off. Ask your school's owner to turn it back on."
          : "This account isn't linked to a school yet.",
      );
    }
    if (me.activeTenant?.status === "suspended") {
      await fetch("/api/auth/sign-out", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: "{}" }).catch(() => null);
      setSubmitting(false);
      return setError(`${me.activeTenant.name}'s access is suspended. Contact DeepDev support to restore it.`);
    }
    dispatch(signedIn(me.user.id));
    goOn(me.user.role);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (API_MODE) return void signInWithApi(new FormData(e.currentTarget));
    // Mock sign-in until the API exists: a demo account's email signs in as
    // that role, and any other email signs in as the owner.
    const email = String(new FormData(e.currentTarget).get("email")).trim().toLowerCase();
    const user = users.find((u) => u.email === email) ?? users.find((u) => u.id === DEFAULT_USER_ID);
    if (!user) return;
    if (user.status === "disabled") {
      setError("This account's access has been turned off. Ask your school's owner to turn it back on.");
      return;
    }
    setError(null);
    setSubmitting(true);
    writeSessionCookie(user.id);
    dispatch(signedIn(user.id));
    goOn(user.role);
  };

  return (
    <Card className="gap-6 px-6">
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Use your school email and password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <Input id="email" name="email" type="email" autoComplete="email" required className="h-10 bg-card" />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href="/reset-password"
              className="rounded text-sm text-primary outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="h-10 bg-card pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}

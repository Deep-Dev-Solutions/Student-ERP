import { NextResponse, type NextRequest } from "next/server";
import { canAccessPath, landingPath } from "@/lib/auth/permissions";
import { SESSION_COOKIE } from "@/lib/auth/session-cookie";
import { findUser, users } from "@/mocks/users";

/** Pages anyone can open without signing in. */
const PUBLIC_PATHS = ["/login", "/reset-password", "/forbidden"];

/*
 * Mock auth gate until the real API exists: a cookie holds the demo user's id.
 * In development, add ?as=<role> to any URL to view the app as that role
 * (owner, branch_admin, accountant, front_desk, teacher, super_admin).
 */
export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const viewAs = searchParams.get("as");
  if (viewAs && process.env.NODE_ENV !== "production") {
    const user = users.find((u) => u.role === viewAs || u.id === viewAs);
    if (user) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("as");
      const response = NextResponse.redirect(url);
      response.cookies.set(SESSION_COOKIE, user.id, { path: "/", sameSite: "lax" });
      return response;
    }
  }

  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const user = findUser(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (pathname === "/") return NextResponse.redirect(new URL(landingPath(user.role), request.url));

  // Admission and import used to be tabs on /students.
  const oldTab = pathname === "/students" ? searchParams.get("tab") : null;
  if (oldTab === "admission" || oldTab === "import") {
    return NextResponse.redirect(new URL(oldTab === "admission" ? "/students/new" : "/students/import", request.url));
  }

  if (!canAccessPath(user.role, pathname)) {
    return NextResponse.rewrite(new URL("/forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next.js internals and files with an extension (favicon, images, fonts).
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};

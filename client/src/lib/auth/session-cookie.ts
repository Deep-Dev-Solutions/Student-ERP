/** Mock session: the signed-in demo user's id, until real auth exists. */
export const SESSION_COOKIE = "dd_session";

export function readSessionCookie(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function writeSessionCookie(userId: string) {
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(userId)}; path=/; samesite=lax`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`;
}

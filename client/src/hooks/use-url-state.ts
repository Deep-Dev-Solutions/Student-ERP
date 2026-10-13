"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * Small URL-backed state for tabs and filters. Pages stay statically
 * prerendered: the server renders the default value, and the browser
 * switches to the value in the address bar after hydration.
 */

const URL_CHANGE = "dd:urlchange";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_CHANGE, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_CHANGE, onChange);
  };
}

/** A query-string value (e.g. ?q=ahmed) with a setter that updates the address bar in place. */
export function useUrlParam(key: string, fallback: string): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(key) ?? fallback,
    () => fallback
  );

  const setValue = useCallback(
    (next: string) => {
      const url = new URL(window.location.href);
      if (next === fallback || next === "") url.searchParams.delete(key);
      else url.searchParams.set(key, next);
      window.history.replaceState(null, "", url);
      window.dispatchEvent(new Event(URL_CHANGE));
    },
    [key, fallback]
  );

  return [value, setValue];
}

/** The active tab, kept in ?tab= so refresh and shared links open the same tab. */
export function useUrlTab<T extends string>(fallback: T, tabs: readonly T[]): [T, (value: string) => void] {
  const [value, setValue] = useUrlParam("tab", fallback);
  return [(tabs as readonly string[]).includes(value) ? (value as T) : fallback, setValue];
}

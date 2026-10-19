"use client";

import { useSyncExternalStore } from "react";
import { THEME_KEY } from "./theme-script";

export type ThemeChoice = "light" | "dark" | "system";

const listeners = new Set<() => void>();

function read(): ThemeChoice {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

function applyTheme(choice: ThemeChoice) {
  const dark = choice === "dark" || (choice === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const media = matchMedia("(prefers-color-scheme: dark)");
  const onSystem = () => {
    if (read() === "system") applyTheme("system");
    onChange();
  };
  media.addEventListener("change", onSystem);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onSystem);
  };
}

/** The saved theme choice and a setter that applies it at once. */
export function useTheme(): [ThemeChoice, (choice: ThemeChoice) => void] {
  const choice = useSyncExternalStore(subscribe, read, () => "system" as ThemeChoice);
  const setTheme = (next: ThemeChoice) => {
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage blocked: the theme still changes for this visit.
    }
    applyTheme(next);
    listeners.forEach((fn) => fn());
  };
  return [choice, setTheme];
}

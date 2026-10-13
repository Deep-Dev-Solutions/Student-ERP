"use client";

import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { readSessionCookie } from "@/lib/auth/session-cookie";
import { findUser } from "@/mocks/users";
import { makeStore } from "./index";
import { branchSelected, signedIn } from "./sessionSlice";

const BRANCH_KEY = "dd_branch";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(makeStore);
  // What the server rendered with. Components that hydrate later (inside
  // Suspense) read this while hydrating, so they match the server HTML even
  // after the session below has loaded; then they update.
  const [serverState] = useState(() => store.getState());

  // The server always renders the default session. After hydration, load the
  // signed-in user from the cookie and the last campus from this browser.
  useEffect(() => {
    const userId = readSessionCookie();
    if (userId && findUser(userId)) store.dispatch(signedIn(userId));
    try {
      const branchId = localStorage.getItem(BRANCH_KEY);
      if (branchId) store.dispatch(branchSelected(branchId));
    } catch {
      // Storage can be blocked; the default campus is fine.
    }
    return store.subscribe(() => {
      try {
        localStorage.setItem(BRANCH_KEY, store.getState().session.branchId);
      } catch {
        // Ignore: remembering the campus is a convenience.
      }
    });
  }, [store]);

  return (
    <Provider store={store} serverState={serverState}>
      {children}
    </Provider>
  );
}

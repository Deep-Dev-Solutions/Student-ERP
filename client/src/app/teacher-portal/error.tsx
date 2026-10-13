"use client";

import { RouteError } from "@/components/shared/RouteError";

export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <RouteError {...props} />
    </div>
  );
}

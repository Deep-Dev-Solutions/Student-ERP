"use client";

import { RouteError } from "@/components/shared/RouteError";

export default function Error(props: { error: Error & { digest?: string }; retry: () => void }) {
  return <RouteError {...props} />;
}

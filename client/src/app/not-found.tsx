import { FileQuestion } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The link may be out of date, or the page has moved."
        action={<ButtonLink href="/dashboard">Go to dashboard</ButtonLink>}
      />
    </main>
  );
}

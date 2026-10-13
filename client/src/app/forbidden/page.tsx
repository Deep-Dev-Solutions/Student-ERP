import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = { title: "No access" };

export default function Forbidden() {
  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6">
      <EmptyState
        icon={ShieldAlert}
        title="You don't have access to this page"
        description="Your role doesn't include this section. Ask your school's owner to change your permissions."
        action={<ButtonLink href="/">Go to my home page</ButtonLink>}
      />
    </main>
  );
}

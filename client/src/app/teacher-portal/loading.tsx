import { PageSkeleton } from "@/components/shared/PageSkeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <PageSkeleton />
    </div>
  );
}

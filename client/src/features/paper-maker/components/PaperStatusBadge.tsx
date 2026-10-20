import { Badge } from "@/components/ui/badge";
import { PAPER_STATUS_LABELS } from "@/services/paper/contract";
import type { PaperStatus } from "@/types";

const variants = { draft: "neutral", submitted: "info", printed: "success", returned: "warning" } as const;

export function PaperStatusBadge({ status }: { status: PaperStatus }) {
  return <Badge variant={variants[status]}>{PAPER_STATUS_LABELS[status]}</Badge>;
}

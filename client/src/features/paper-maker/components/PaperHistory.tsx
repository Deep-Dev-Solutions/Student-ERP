import type { Paper } from "@/types";

const actionLabels = { created: "Started", submitted: "Submitted for printing", printed: "Printed", returned: "Returned to the teacher" } as const;

/** Who did what to a paper, newest first. */
export function PaperHistory({ paper }: { paper: Paper }) {
  return (
    <ol className="space-y-2 text-sm">
      {[...paper.history].reverse().map((e, i) => (
        <li key={i} className="border-l-2 border-border pl-3">
          <p className="font-medium">{actionLabels[e.action]}</p>
          <p className="text-muted-foreground">
            {new Date(e.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}, {e.by}
          </p>
          {e.note ? <p className="mt-0.5">{e.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

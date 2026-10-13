import { AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pendingTasks } from "../data";

export function PendingTasks() {
  if (pendingTasks.length === 0) return null;

  return (
    <section aria-labelledby="pending-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="pending-heading" className="text-base font-semibold">
          Needs your attention
        </h2>
        <Badge variant="highlight">{pendingTasks.length} to do</Badge>
      </div>

      <ul className="space-y-2">
        {pendingTasks.map((task) => {
          const isHigh = task.urgency === "high";
          return (
            <li key={task.id}>
              <Card className="gap-0 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ${
                        isHigh ? "bg-danger-tint text-danger" : "bg-warning-tint text-warning"
                      }`}
                    >
                      <AlertTriangle aria-hidden className="size-4" />
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <Badge variant={isHigh ? "danger" : "warning"}>{isHigh ? "Due now" : "Due soon"}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">{task.description}</p>
                    </div>
                  </div>
                  <ButtonLink href={task.actionHref} size="sm" variant={isHigh ? "default" : "outline"} className="self-end sm:self-center">
                    {task.actionLabel}
                    <ArrowRight data-icon="inline-end" />
                  </ButtonLink>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

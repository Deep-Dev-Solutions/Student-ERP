"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatRupeesCompact } from "@/lib/format";
import { feeCollection, feeTarget } from "@/services/dashboard";
import { ChartDataTable } from "./ChartDataTable";

const config = {
  collected: { label: "Collected", color: "var(--chart-1)" },
} satisfies ChartConfig;

const currentIndex = feeCollection.findIndex((m) => m.current);

export function FeeCollectionChart() {
  return (
    <Card className="gap-4 px-5 sm:px-6">
      <div>
        <h2 className="text-base font-semibold">Monthly fee collection</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          This academic year against the {formatRupeesCompact(feeTarget.target)} monthly target. October
          is month to date.
        </p>
      </div>

      <ChartContainer config={config} className="aspect-auto h-64 w-full min-w-0">
        <BarChart data={feeCollection} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={64}
            domain={[0, 2_000_000]}
            ticks={[0, 500_000, 1_000_000, 1_500_000, 2_000_000]}
            tickFormatter={(v: number) => (v === 0 ? "0" : formatRupeesCompact(v))}
          />
          <ReferenceLine
            y={feeTarget.target}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            label={{
              value: "Target",
              position: "insideTopRight",
              fill: "var(--muted-foreground)",
              fontSize: 12,
            }}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)" }}
            content={
              <ChartTooltipContent
                hideIndicator
                formatter={(value) => (
                  <span className="font-medium text-foreground">{formatRupeesCompact(Number(value))}</span>
                )}
              />
            }
          />
          <Bar dataKey="collected" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {feeCollection.map((m) => (
              <Cell key={m.month} fill={m.current ? "var(--chart-1)" : "var(--chart-2)"} />
            ))}
            <LabelList
              dataKey="collected"
              content={(props) => {
                const { x, y, width, value, index } = props as {
                  x?: number; y?: number; width?: number; value?: number; index?: number;
                };
                if (index !== currentIndex) return null;
                return (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - 8}
                    textAnchor="middle"
                    fontSize={12}
                    className="fill-foreground font-medium"
                  >
                    {formatRupeesCompact(Number(value))}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ChartContainer>

      <ChartDataTable
        caption="Monthly fee collection"
        columns={["Month", "Collected", "Of target"]}
        rows={feeCollection.map((m) => [
          m.current ? `${m.month} (to date)` : m.month,
          formatRupeesCompact(m.collected),
          `${Math.round((m.collected / feeTarget.target) * 100)}%`,
        ])}
      />
    </Card>
  );
}

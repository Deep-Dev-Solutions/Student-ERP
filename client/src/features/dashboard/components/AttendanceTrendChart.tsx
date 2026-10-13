"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { attendanceTrend } from "@/features/dashboard/data";
import { ChartDataTable } from "./ChartDataTable";

const config = {
  rate: { label: "Attendance", color: "var(--chart-1)" },
} satisfies ChartConfig;

const lastIndex = attendanceTrend.length - 1;
const average =
  Math.round((attendanceTrend.reduce((sum, d) => sum + d.rate, 0) / attendanceTrend.length) * 10) /
  10;

export function AttendanceTrendChart() {
  return (
    <Card className="gap-4 px-5">
      <div>
        <h2 className="text-base font-semibold">Daily attendance</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Last {attendanceTrend.length} school days · average {average}%
        </p>
      </div>

      <ChartContainer config={config} className="aspect-auto h-64 w-full min-w-0">
        <AreaChart data={attendanceTrend} margin={{ top: 12, right: 48, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="attendance-wash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-rate)" stopOpacity={0.12} />
              <stop offset="100%" stopColor="var(--color-rate)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval="preserveStartEnd"
            minTickGap={24}
          />
          <YAxis
            domain={[85, 100]}
            ticks={[85, 90, 95, 100]}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => `${v}%`}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="line"
                formatter={(value) => (
                  <span className="font-medium text-foreground">{Number(value).toFixed(1)}%</span>
                )}
              />
            }
          />
          <Area
            dataKey="rate"
            type="monotone"
            stroke="var(--color-rate)"
            strokeWidth={2}
            fill="url(#attendance-wash)"
            isAnimationActive={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
            dot={(props: { cx?: number; cy?: number; index?: number; payload?: { rate: number } }) =>
              props.index === lastIndex ? (
                <g key="end">
                  <circle cx={props.cx} cy={props.cy} r={4} fill="var(--color-rate)" stroke="var(--card)" strokeWidth={2} />
                  <text x={(props.cx ?? 0) + 8} y={(props.cy ?? 0) + 4} fontSize={12} className="fill-foreground font-medium">
                    {props.payload?.rate}%
                  </text>
                </g>
              ) : (
                <g key={props.index} />
              )
            }
          />
        </AreaChart>
      </ChartContainer>

      <ChartDataTable
        caption="Daily attendance"
        columns={["Date", "Attendance"]}
        rows={attendanceTrend.map((d) => [d.date, `${d.rate}%`])}
      />
    </Card>
  );
}

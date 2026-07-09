"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/charts/chart-tooltip";

export function LineStatChart({
  data,
  color = "var(--color-chart-1)",
  valueFormatter,
  height = 200,
  domain,
}: {
  data: { label: string; value: number }[];
  color?: string;
  valueFormatter?: (v: number) => string;
  height?: number;
  domain?: [number, number];
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          width={36}
          domain={domain}
        />
        <Tooltip
          cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
          content={(props) => (
            <ChartTooltip {...props} valueFormatter={valueFormatter} color={color} />
          )}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 2, stroke: "var(--color-card)" }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--color-card)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

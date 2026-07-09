"use client";

import {
  CartesianGrid,
  Scatter,
  ScatterChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function ScatterStatChart({
  data,
  xLabel,
  yLabel,
  color = "var(--color-chart-1)",
  height = 240,
}: {
  data: { x: number; y: number; date: string }[];
  xLabel: string;
  yLabel: string;
  color?: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 4, right: 12, left: 4, bottom: 4 }}>
        <CartesianGrid stroke="var(--color-border)" strokeDasharray="0" />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tickLine={false}
          axisLine={{ stroke: "var(--color-border)" }}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          label={{ value: xLabel, position: "insideBottom", offset: -2, fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yLabel}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          width={44}
          label={{ value: yLabel, angle: -90, position: "insideLeft", fill: "var(--color-muted-foreground)", fontSize: 11 }}
        />
        <Tooltip
          cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as { x: number; y: number; date: string };
            return (
              <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
                <div className="mb-1 text-muted-foreground">{p.date}</div>
                <div className="text-sm font-semibold text-popover-foreground">
                  {xLabel}: {p.x} · {yLabel}: {p.y}
                </div>
              </div>
            );
          }}
        />
        <Scatter data={data} fill={color} fillOpacity={0.75} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

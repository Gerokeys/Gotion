type ChartTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string | readonly (number | string)[] }>;
  label?: string | number;
  valueFormatter?: (v: number) => string;
  color?: string;
};

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  color = "var(--color-chart-1)",
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  if (value === undefined || value === null) return null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
        <span className="inline-block h-[2px] w-3" style={{ backgroundColor: color }} />
        {label}
      </div>
      <div className="text-sm font-semibold text-popover-foreground">
        {valueFormatter ? valueFormatter(Number(value)) : value}
      </div>
    </div>
  );
}

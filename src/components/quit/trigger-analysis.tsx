import { BarStatChart } from "@/components/charts/bar-stat-chart";

type Bucket = { label: string; value: number }[];

export function TriggerAnalysis({
  byTrigger,
  byMood,
  byTimeOfDay,
  byWeekday,
}: {
  byTrigger: Bucket;
  byMood: Bucket;
  byTimeOfDay: Bucket;
  byWeekday: Bucket;
}) {
  const total = byTrigger.reduce((s, b) => s + b.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No relapses logged yet — nothing to analyze, and that&apos;s a good thing.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ChartCard title="By trigger" data={byTrigger} />
      <ChartCard title="By mood" data={byMood} />
      <ChartCard title="By time of day" data={byTimeOfDay} />
      <ChartCard title="By day of week" data={byWeekday} />
    </div>
  );
}

function ChartCard({ title, data }: { title: string; data: Bucket }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <BarStatChart data={data} color="var(--color-chart-1)" height={160} />
    </div>
  );
}

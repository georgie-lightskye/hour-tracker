"use client";

interface BarItem {
  label: string;
  value: number;
  color?: string;
}

interface SummaryChartProps {
  title: string;
  items: BarItem[];
  unit?: string;
}

export default function SummaryChart({ title, items, unit = "h" }: SummaryChartProps) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-text-tertiary">No data available.</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-20 text-right truncate font-mono">
                {item.label}
              </span>
              <div className="flex-1 h-6 bg-bg-base rounded-md overflow-hidden">
                <div
                  className="h-full rounded-md transition-all duration-700 ease-out"
                  style={{
                    width: `${(item.value / max) * 100}%`,
                    backgroundColor: item.color || "var(--accent)",
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              </div>
              <span className="text-xs text-text-primary font-mono w-14 text-right">
                {item.value.toFixed(1)}{unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

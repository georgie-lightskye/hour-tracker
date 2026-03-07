"use client";

import { useState, useEffect, useMemo } from "react";
import AuthGuard from "@/components/AuthGuard";
import SummaryChart from "@/components/SummaryChart";
import ExportButton from "@/components/ExportButton";
import { useAuth } from "@/lib/auth-context";
import { getEntriesByUser, getAllEntries } from "@/lib/firestore";
import { formatDuration, formatDateShort, getWeekRange, getMonthRange } from "@/lib/utils";
import type { Entry, DateRange } from "@/lib/types";
import { FiClock, FiZap, FiDollarSign, FiPercent } from "react-icons/fi";

type Preset = "this-week" | "last-week" | "this-month" | "last-month" | "custom";

function getPresetRange(preset: Preset): DateRange {
  const now = new Date();
  switch (preset) {
    case "this-week":
      return getWeekRange(now);
    case "last-week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return getWeekRange(d);
    }
    case "this-month":
      return getMonthRange(now);
    case "last-month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 15);
      return getMonthRange(d);
    }
    default:
      return getWeekRange(now);
  }
}

export default function SummaryPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>("this-week");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const dateRange = useMemo(() => {
    if (preset === "custom" && customStart && customEnd) {
      return {
        start: new Date(customStart),
        end: new Date(`${customEnd}T23:59:59.999`),
      };
    }
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const data =
        user.role === "manager"
          ? await getAllEntries(dateRange)
          : await getEntriesByUser(user.uid, dateRange);
      setEntries(data);
      setLoading(false);
    };
    fetch();
  }, [user, dateRange]);

  const stats = useMemo(() => {
    const totalHours = entries.reduce((sum, e) => sum + e.totalHours, 0);
    const activeHours = entries.reduce((sum, e) => sum + e.activeHours, 0);
    const billableHours = entries.reduce((sum, e) => sum + e.billableHours, 0);
    const billablePercent = activeHours > 0 ? (billableHours / activeHours) * 100 : 0;
    return { totalHours, activeHours, billableHours, billablePercent };
  }, [entries]);

  const dailyHours = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      const key = formatDateShort(e.date);
      map.set(key, (map.get(key) || 0) + e.activeHours);
    });
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [entries]);

  const categoryHours = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      const totalTaskHours = e.tasks.reduce((sum, t) => sum + (t.hours || 0), 0);
      const useWeights = totalTaskHours > 0;
      const perTaskHours = e.tasks.length > 0 ? e.activeHours / e.tasks.length : 0;
      e.tasks.forEach((t) => {
        const cat = t.category || "#uncategorized";
        const hours = useWeights ? (t.hours || 0) : perTaskHours;
        map.set(cat, (map.get(cat) || 0) + hours);
      });
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value, color: "var(--accent-secondary)" }))
      .sort((a, b) => b.value - a.value);
  }, [entries]);

  const presets: { key: Preset; label: string }[] = [
    { key: "this-week", label: "This Week" },
    { key: "last-week", label: "Last Week" },
    { key: "this-month", label: "This Month" },
    { key: "last-month", label: "Last Month" },
    { key: "custom", label: "Custom" },
  ];

  const statCards = [
    { label: "Total Hours", value: formatDuration(stats.totalHours), icon: FiClock, color: "text-text-primary" },
    { label: "Active Hours", value: formatDuration(stats.activeHours), icon: FiZap, color: "text-accent" },
    { label: "Billable Hours", value: formatDuration(stats.billableHours), icon: FiDollarSign, color: "text-success" },
    { label: "Billable %", value: `${stats.billablePercent.toFixed(0)}%`, icon: FiPercent, color: "text-warning" },
  ];

  return (
    <AuthGuard>
      <div className="animate-[fadeInUp_0.5s_ease-out]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-1">Summary</h1>
            <p className="text-text-secondary text-sm">Hours breakdown and analytics</p>
          </div>
          <ExportButton entries={entries} dateLabel={preset} />
        </div>

        {/* Date range filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {presets.map((p) => (
            <button
              key={p.key}
              onClick={() => setPreset(p.key)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                preset === p.key
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-surface border border-border text-text-secondary hover:text-text-primary"
              }`}
            >
              {p.label}
            </button>
          ))}
          {preset === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
              />
              <span className="text-text-tertiary text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-surface border border-border rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-surface-elevated rounded w-16 mb-3" />
                <div className="h-6 bg-surface-elevated rounded w-20" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {statCards.map((stat, i) => (
                <div
                  key={stat.label}
                  className="bg-surface border border-border rounded-xl p-4"
                  style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    <span className="text-xs text-text-secondary uppercase tracking-wider">
                      {stat.label}
                    </span>
                  </div>
                  <p className={`text-xl font-bold font-mono ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-2 gap-6">
              <SummaryChart title="Daily Active Hours" items={dailyHours} />
              <SummaryChart title="Hours by Category" items={categoryHours} />
            </div>

            {/* Entry count */}
            <p className="text-xs text-text-tertiary mt-6 text-center">
              {entries.length} entr{entries.length === 1 ? "y" : "ies"} in selected range
            </p>
          </>
        )}
      </div>
    </AuthGuard>
  );
}

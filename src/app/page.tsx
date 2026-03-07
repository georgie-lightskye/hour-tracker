"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import EntryList from "@/components/EntryList";
import Timer from "@/components/Timer";
import { useAuth } from "@/lib/auth-context";
import { getEntriesByUser, getAllEntries } from "@/lib/firestore";
import { formatDuration, getWeekRange } from "@/lib/utils";
import type { Entry } from "@/lib/types";
import { FiClock, FiZap, FiDollarSign } from "react-icons/fi";

function StatsRow() {
  const { user } = useAuth();
  const [todayHours, setTodayHours] = useState(0);
  const [weekHours, setWeekHours] = useState(0);
  const [weekBillable, setWeekBillable] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const weekRange = getWeekRange(new Date());
      const entries: Entry[] =
        user.role === "manager"
          ? await getAllEntries(weekRange)
          : await getEntriesByUser(user.uid, weekRange);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let todayActive = 0;
      let weekActive = 0;
      let weekBill = 0;

      entries.forEach((e) => {
        weekActive += e.activeHours;
        weekBill += e.billableHours;
        const entryDate = new Date(e.date);
        entryDate.setHours(0, 0, 0, 0);
        if (entryDate.getTime() === today.getTime()) {
          todayActive += e.activeHours;
        }
      });

      setTodayHours(todayActive);
      setWeekHours(weekActive);
      setWeekBillable(weekBill);
    };
    fetchStats();
  }, [user]);

  const stats = [
    { label: "Today", value: formatDuration(todayHours), icon: FiClock, color: "text-accent" },
    { label: "This Week", value: formatDuration(weekHours), icon: FiZap, color: "text-accent-secondary" },
    { label: "Billable (Week)", value: formatDuration(weekBillable), icon: FiDollarSign, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="bg-surface border border-border rounded-xl p-4"
          style={{ animation: `fadeInUp 0.4s ease-out ${i * 0.08}s both` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-text-secondary uppercase tracking-wider">{stat.label}</span>
          </div>
          <p className={`text-xl font-bold font-[family-name:var(--font-mono)] ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AuthGuard>
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-1">Dashboard</h1>
        <p className="text-text-secondary text-sm mb-6">
          {user?.role === "manager" ? "Developer activity overview" : "Your work sessions"}
        </p>

        {/* Timer for developer */}
        {user?.role === "developer" && (
          <div className="mb-8">
            <Timer />
          </div>
        )}

        <StatsRow />

        <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Entries</h2>
        <EntryList />
      </div>
    </AuthGuard>
  );
}

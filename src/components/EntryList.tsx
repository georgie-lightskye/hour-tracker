"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getEntriesByUser, getAllEntries, resumeEntry, getTimerState } from "@/lib/firestore";
import type { Entry } from "@/lib/types";
import EntryCard from "./EntryCard";
import { FiSearch, FiFilter } from "react-icons/fi";

export default function EntryList() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "in-progress">("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchEntries = async () => {
      setLoading(true);
      const [data, timer] = await Promise.all([
        user.role === "manager"
          ? getAllEntries()
          : getEntriesByUser(user.uid),
        user.role === "developer" ? getTimerState(user.uid) : null,
      ]);
      setEntries(data);
      setTimerActive(!!timer?.isRunning);
      setLoading(false);
    };
    fetchEntries();
  }, [user]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    entries.forEach((e) => e.tasks.forEach((t) => cats.add(t.category)));
    return Array.from(cats).filter(Boolean).sort();
  }, [entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (statusFilter !== "all" && entry.status !== statusFilter) return false;
      if (categoryFilter && !entry.tasks.some((t) => t.category === categoryFilter)) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesTask = entry.tasks.some(
          (t) =>
            t.description.toLowerCase().includes(q) ||
            t.subtasks.some((s) => s.toLowerCase().includes(q))
        );
        const matchesNotes = entry.notes.toLowerCase().includes(q);
        if (!matchesTask && !matchesNotes) return false;
      }
      return true;
    });
  }, [entries, search, statusFilter, categoryFilter]);

  const handleResume = async (entryId: string) => {
    if (!user) return;
    await resumeEntry(user.uid, entryId);
    router.refresh();
    window.location.reload();
  };

  // Check if an entry is from today (eligible for resume)
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-surface-elevated rounded w-32 mb-3" />
            <div className="h-3 bg-surface-elevated rounded w-48 mb-2" />
            <div className="h-3 bg-surface-elevated rounded w-40" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent transition-all"
          />
        </div>
        <div className="relative">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-3.5 h-3.5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "completed" | "in-progress")}
            className="bg-surface border border-border rounded-lg pl-9 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
          </select>
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-surface border border-border rounded-lg px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent transition-all appearance-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary text-sm">No entries found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              showUser={user?.role === "manager"}
              onResume={handleResume}
              canResume={
                user?.role === "developer" &&
                !timerActive &&
                isToday(entry.date) &&
                entry.status === "completed"
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

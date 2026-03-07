"use client";

import Link from "next/link";
import type { Entry } from "@/lib/types";
import { formatDate, formatTime, formatDuration } from "@/lib/utils";
import { FiChevronRight, FiClock, FiFlag, FiPlay } from "react-icons/fi";

interface EntryCardProps {
  entry: Entry;
  index?: number;
  showUser?: boolean;
  onResume?: (entryId: string) => void;
  canResume?: boolean;
}

export default function EntryCard({ entry, index = 0, showUser, onResume, canResume }: EntryCardProps) {
  const categories = [...new Set(entry.tasks.map((t) => t.category))];
  const hasFlagged = entry.tasks.some((t) => t.flagged);

  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 hover:border-accent/30 hover:bg-surface-elevated transition-all group"
      style={{ animation: `fadeInUp 0.4s ease-out ${index * 0.06}s both` }}
    >
      <div className="flex items-start justify-between">
        <Link href={`/entry/${entry.id}`} className="flex-1 min-w-0">
          {/* Date and status */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-text-primary">
              {formatDate(entry.date)}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                entry.status === "completed"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {entry.status === "completed" ? "Completed" : "In Progress"}
            </span>
            {hasFlagged && <FiFlag className="w-3.5 h-3.5 text-danger" />}
          </div>

          {/* Time range */}
          <div className="flex items-center gap-2 text-xs text-text-secondary font-mono mb-3">
            <FiClock className="w-3 h-3" />
            {formatTime(entry.checkIn)}
            {entry.checkOut ? ` - ${formatTime(entry.checkOut)}` : " - ongoing"}
          </div>

          {/* Hours */}
          <div className="flex items-center gap-4 mb-3 text-sm font-mono">
            <span className="text-text-secondary">
              Active: <span className="text-accent font-medium">{formatDuration(entry.activeHours)}</span>
            </span>
            <span className="text-text-secondary">
              Billable: <span className="text-success font-medium">{formatDuration(entry.billableHours)}</span>
            </span>
          </div>

          {/* Tasks preview */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-[11px] bg-accent/10 text-accent px-2 py-0.5 rounded-md font-medium"
              >
                {cat}
              </span>
            ))}
            <span className="text-[11px] text-text-tertiary px-1">
              {entry.tasks.length} task{entry.tasks.length !== 1 ? "s" : ""}
            </span>
          </div>

          {showUser && (
            <p className="text-xs text-text-tertiary mt-2">
              User: {entry.userId}
            </p>
          )}
        </Link>

        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
          {canResume && onResume && entry.status === "completed" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onResume(entry.id);
              }}
              className="flex items-center gap-1.5 text-xs bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-all"
            >
              <FiPlay className="w-3 h-3" />
              Resume
            </button>
          )}
          <FiChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import CommentSection from "@/components/CommentSection";
import ManagerControls from "@/components/ManagerControls";
import EntryEditor from "@/components/EntryEditor";
import { useAuth } from "@/lib/auth-context";
import { getEntry } from "@/lib/firestore";
import { formatDate, formatTime, formatDuration, calculateBreakHours } from "@/lib/utils";
import type { Entry } from "@/lib/types";
import {
  FiArrowLeft,
  FiClock,
  FiCoffee,
  FiLink,
  FiFileText,
  FiHash,
  FiFlag,
  FiEdit2,
} from "react-icons/fi";

export default function EntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const id = params.id as string;

  const fetchEntry = useCallback(async () => {
    const data = await getEntry(id);
    setEntry(data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchEntry();
  }, [fetchEntry]);

  if (loading) {
    return (
      <AuthGuard>
        <div className="max-w-3xl animate-pulse space-y-6">
          <div className="h-6 bg-surface rounded w-48" />
          <div className="h-40 bg-surface rounded-xl" />
        </div>
      </AuthGuard>
    );
  }

  if (!entry) {
    return (
      <AuthGuard>
        <div className="text-center py-20">
          <p className="text-text-secondary">Entry not found.</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-accent hover:underline text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </AuthGuard>
    );
  }

  const breakHours = calculateBreakHours(entry.breaks);

  return (
    <AuthGuard>
      <div className="max-w-3xl animate-[fadeInUp_0.5s_ease-out]">
        {/* Header */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">
              {formatDate(entry.date)}
            </h1>
            <span
              className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                entry.status === "completed"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              }`}
            >
              {entry.status === "completed" ? "Completed" : "In Progress"}
            </span>
          </div>
          {user && entry.userId === user.uid && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs bg-accent/10 text-accent border border-accent/20 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-all"
            >
              <FiEdit2 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Time & Hours */}
          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
              <FiClock className="w-4 h-4 text-accent" /> Time
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-text-tertiary mb-1">Check In</p>
                <p className="text-sm text-text-primary font-mono">
                  {formatTime(entry.checkIn)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Check Out</p>
                <p className="text-sm text-text-primary font-mono">
                  {entry.checkOut ? formatTime(entry.checkOut) : "In Progress"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-text-tertiary mb-1">Total</p>
                <p className="text-lg font-bold font-mono text-text-primary">
                  {formatDuration(entry.totalHours)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Breaks</p>
                <p className="text-lg font-bold font-mono text-accent-secondary">
                  {formatDuration(breakHours)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Active</p>
                <p className="text-lg font-bold font-mono text-accent">
                  {formatDuration(entry.activeHours)}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-tertiary mb-1">Billable</p>
                <p className="text-lg font-bold font-mono text-success">
                  {formatDuration(entry.billableHours)}
                </p>
              </div>
            </div>
          </section>

          {/* Breaks */}
          {entry.breaks.length > 0 && (
            <section className="bg-surface border border-border rounded-xl p-6">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                <FiCoffee className="w-4 h-4 text-accent-secondary" /> Breaks
              </h2>
              <div className="space-y-2">
                {entry.breaks.map((b, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-text-primary">
                      {formatTime(b.start)}
                    </span>
                    <span className="text-text-tertiary">to</span>
                    <span className="font-mono text-text-primary">
                      {b.end ? formatTime(b.end) : "Ongoing"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {editing ? (
            <EntryEditor
              entry={entry}
              onSave={() => {
                setEditing(false);
                fetchEntry();
              }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              {/* Tasks */}
              <section className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FiHash className="w-4 h-4 text-accent" /> Tasks ({entry.tasks.length})
                </h2>
                {entry.tasks.length === 0 ? (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm text-accent hover:underline"
                  >
                    + Add tasks
                  </button>
                ) : (
                  <div className="space-y-4">
                    {entry.tasks.map((task, i) => (
                      <div key={i} className="bg-bg-base border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <p className="text-sm font-medium text-text-primary">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            {task.hours > 0 && (
                              <span className="text-[10px] bg-surface-elevated text-text-secondary px-2 py-0.5 rounded-md font-mono">
                                {formatDuration(task.hours)}
                              </span>
                            )}
                            {task.category && (
                              <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-md">
                                {task.category}
                              </span>
                            )}
                            {task.billable && (
                              <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-md">
                                Billable
                              </span>
                            )}
                            {task.flagged && (
                              <FiFlag className="w-3.5 h-3.5 text-danger" />
                            )}
                          </div>
                        </div>
                        {task.subtasks.length > 0 && (
                          <ul className="pl-4 border-l-2 border-border space-y-1 mt-2">
                            {task.subtasks.map((sub, si) => (
                              <li key={si} className="text-xs text-text-secondary">
                                {sub}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Resources */}
              {entry.resources.length > 0 && (
                <section className="bg-surface border border-border rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FiLink className="w-4 h-4 text-accent" /> Resources
                  </h2>
                  <div className="space-y-2">
                    {entry.resources.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-accent-secondary hover:underline truncate"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </section>
              )}

              {/* Notes */}
              {entry.notes && (
                <section className="bg-surface border border-border rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FiFileText className="w-4 h-4 text-accent" /> Notes
                  </h2>
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                    {entry.notes}
                  </p>
                </section>
              )}
            </>
          )}

          {/* Manager Controls */}
          {user?.role === "manager" && (
            <ManagerControls
              entryId={entry.id}
              tasks={entry.tasks}
              onUpdate={fetchEntry}
            />
          )}

          {/* Comments */}
          <CommentSection entryId={entry.id} />
        </div>
      </div>
    </AuthGuard>
  );
}

"use client";

import { useState } from "react";
import { updateEntry } from "@/lib/firestore";
import { calculateBillableHours, formatDuration } from "@/lib/utils";
import type { Entry, Task } from "@/lib/types";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiX,
  FiHash,
  FiLink,
  FiFileText,
} from "react-icons/fi";

interface EntryEditorProps {
  entry: Entry;
  onSave: () => void;
  onCancel: () => void;
}

interface EditableTask {
  description: string;
  category: string;
  subtasks: string[];
  billable: boolean;
  flagged?: boolean;
  hours: string;
  minutes: string;
}

function taskToEditable(task: Task): EditableTask {
  const totalMinutes = Math.round(task.hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return {
    description: task.description,
    category: task.category,
    subtasks: [...task.subtasks],
    billable: task.billable,
    flagged: task.flagged,
    hours: h > 0 ? String(h) : "",
    minutes: m > 0 ? String(m) : "",
  };
}

export default function EntryEditor({ entry, onSave, onCancel }: EntryEditorProps) {
  const [tasks, setTasks] = useState<EditableTask[]>(
    entry.tasks.length > 0 ? entry.tasks.map(taskToEditable) : [{ description: "", category: "", subtasks: [], billable: true, hours: "", minutes: "" }]
  );
  const [resources, setResources] = useState<string[]>([...entry.resources]);
  const [notes, setNotes] = useState(entry.notes);
  const [saving, setSaving] = useState(false);

  const assignedHours = tasks.reduce((sum, t) => sum + (parseFloat(t.hours) || 0) + (parseFloat(t.minutes) || 0) / 60, 0);
  const unassigned = entry.activeHours - assignedHours;

  const handleSave = async () => {
    setSaving(true);
    const finalTasks: Task[] = tasks
      .filter((t) => t.description.trim())
      .map((t) => ({
        description: t.description,
        category: t.category.startsWith("#") ? t.category : t.category ? `#${t.category}` : "",
        subtasks: t.subtasks.filter((s) => s.trim()),
        billable: t.billable,
        flagged: t.flagged ?? false,
        hours: (parseFloat(t.hours) || 0) + (parseFloat(t.minutes) || 0) / 60,
      }));
    const finalResources = resources.filter((r) => r.trim());
    const billableHours = calculateBillableHours(finalTasks, entry.activeHours);

    await updateEntry(entry.id, {
      tasks: finalTasks,
      resources: finalResources,
      notes,
      billableHours,
    });
    setSaving(false);
    onSave();
  };

  const updateTask = (index: number, field: string, value: string | boolean) => {
    setTasks((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const removeTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const addSubtask = (taskIndex: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === taskIndex ? { ...t, subtasks: [...t.subtasks, ""] } : t))
    );
  };

  const updateSubtask = (taskIndex: number, subIndex: number, value: string) => {
    setTasks((prev) =>
      prev.map((t, i) =>
        i === taskIndex
          ? { ...t, subtasks: t.subtasks.map((s, si) => (si === subIndex ? value : s)) }
          : t
      )
    );
  };

  const removeSubtask = (taskIndex: number, subIndex: number) => {
    setTasks((prev) =>
      prev.map((t, i) =>
        i === taskIndex ? { ...t, subtasks: t.subtasks.filter((_, si) => si !== subIndex) } : t
      )
    );
  };

  const inputClasses =
    "w-full bg-bg-base border border-border rounded-lg px-3 py-2 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all text-sm";

  return (
    <div className="space-y-6">
      {/* Hours assignment indicator */}
      {assignedHours > 0 && (
        <div className="flex items-center gap-3 text-sm font-mono">
          <span className="text-text-secondary">
            Active: <span className="text-accent">{formatDuration(entry.activeHours)}</span>
          </span>
          <span className="text-text-secondary">
            Assigned: <span className="text-text-primary">{formatDuration(assignedHours)}</span>
          </span>
          <span
            className={
              unassigned < -0.01 ? "text-danger" : unassigned > 0.01 ? "text-warning" : "text-success"
            }
          >
            {unassigned > 0.01
              ? `${formatDuration(unassigned)} unassigned`
              : unassigned < -0.01
              ? `${formatDuration(Math.abs(unassigned))} over-assigned`
              : "All hours assigned"}
          </span>
        </div>
      )}

      {/* Tasks */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <FiHash className="w-4 h-4 text-accent" /> Tasks
          </h2>
          <button
            type="button"
            onClick={() =>
              setTasks((prev) => [...prev, { description: "", category: "", subtasks: [], billable: true, hours: "", minutes: "" }])
            }
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>
        <div className="space-y-4">
          {tasks.map((task, ti) => (
            <div key={ti} className="bg-bg-base border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={task.description}
                    onChange={(e) => updateTask(ti, "description", e.target.value)}
                    className={inputClasses}
                    placeholder="Task description"
                  />
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">
                        #
                      </span>
                      <input
                        type="text"
                        value={task.category.replace(/^#/, "")}
                        onChange={(e) => updateTask(ti, "category", e.target.value)}
                        className={`${inputClasses} pl-7`}
                        placeholder="category"
                      />
                    </div>
                    <div className="relative w-20">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={task.hours}
                        onChange={(e) => updateTask(ti, "hours", e.target.value)}
                        className={`${inputClasses} pr-6 text-right`}
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">
                        h
                      </span>
                    </div>
                    <div className="relative w-20">
                      <input
                        type="number"
                        step="5"
                        min="0"
                        max="59"
                        value={task.minutes}
                        onChange={(e) => updateTask(ti, "minutes", e.target.value)}
                        className={`${inputClasses} pr-8 text-right`}
                        placeholder="0"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">
                        min
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={task.billable}
                        onChange={(e) => updateTask(ti, "billable", e.target.checked)}
                        className="rounded border-border accent-accent"
                      />
                      Billable
                    </label>
                  </div>
                </div>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(ti)}
                    className="text-text-tertiary hover:text-danger transition-colors p-1 mt-1"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Subtasks */}
              <div className="pl-4 border-l-2 border-border space-y-2">
                {task.subtasks.map((sub, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sub}
                      onChange={(e) => updateSubtask(ti, si, e.target.value)}
                      className={`${inputClasses} text-xs`}
                      placeholder="Subtask"
                    />
                    <button
                      type="button"
                      onClick={() => removeSubtask(ti, si)}
                      className="text-text-tertiary hover:text-danger transition-colors p-0.5"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addSubtask(ti)}
                  className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent transition-colors"
                >
                  <FiPlus className="w-3 h-3" /> Add subtask
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resources */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
            <FiLink className="w-4 h-4 text-accent" /> Resources
          </h2>
          <button
            type="button"
            onClick={() => setResources((prev) => [...prev, ""])}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Link
          </button>
        </div>
        {resources.length === 0 && (
          <p className="text-sm text-text-tertiary">No resources added.</p>
        )}
        <div className="space-y-2">
          {resources.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="url"
                value={r}
                onChange={(e) =>
                  setResources((prev) => prev.map((v, vi) => (vi === i ? e.target.value : v)))
                }
                className={inputClasses}
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={() => setResources((prev) => prev.filter((_, vi) => vi !== i))}
                className="text-text-tertiary hover:text-danger transition-colors p-1"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
          <FiFileText className="w-4 h-4 text-accent" /> Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={`${inputClasses} min-h-[100px] resize-y`}
          placeholder="Any additional notes..."
        />
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-accent hover:bg-accent/90 text-bg-base font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_var(--accent-glow)] disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-bg-base border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:border-text-tertiary transition-all flex items-center gap-2"
        >
          <FiX className="w-4 h-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}

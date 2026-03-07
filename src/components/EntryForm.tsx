"use client";

import { useReducer, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createEntry } from "@/lib/firestore";
import {
  calculateTotalHours,
  calculateActiveHours,
  calculateBillableHours,
  formatDuration,
} from "@/lib/utils";
import type { Break, Task } from "@/lib/types";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiClock,
  FiHash,
  FiLink,
  FiFileText,
} from "react-icons/fi";

interface FormState {
  date: string;
  checkIn: string;
  checkOut: string;
  breaks: { start: string; end: string }[];
  tasks: {
    description: string;
    category: string;
    subtasks: string[];
    billable: boolean;
    hours: string;
  }[];
  resources: string[];
  notes: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: string }
  | { type: "ADD_BREAK" }
  | { type: "REMOVE_BREAK"; index: number }
  | { type: "SET_BREAK"; index: number; field: "start" | "end"; value: string }
  | { type: "ADD_TASK" }
  | { type: "REMOVE_TASK"; index: number }
  | { type: "SET_TASK"; index: number; field: string; value: string | boolean }
  | { type: "ADD_SUBTASK"; taskIndex: number }
  | { type: "REMOVE_SUBTASK"; taskIndex: number; subtaskIndex: number }
  | { type: "SET_SUBTASK"; taskIndex: number; subtaskIndex: number; value: string }
  | { type: "ADD_RESOURCE" }
  | { type: "REMOVE_RESOURCE"; index: number }
  | { type: "SET_RESOURCE"; index: number; value: string };

const initialState: FormState = {
  date: new Date().toISOString().split("T")[0],
  checkIn: "",
  checkOut: "",
  breaks: [],
  tasks: [{ description: "", category: "", subtasks: [], billable: true, hours: "" }],
  resources: [],
  notes: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "ADD_BREAK":
      return { ...state, breaks: [...state.breaks, { start: "", end: "" }] };
    case "REMOVE_BREAK":
      return { ...state, breaks: state.breaks.filter((_, i) => i !== action.index) };
    case "SET_BREAK": {
      const breaks = [...state.breaks];
      breaks[action.index] = { ...breaks[action.index], [action.field]: action.value };
      return { ...state, breaks };
    }

    case "ADD_TASK":
      return {
        ...state,
        tasks: [...state.tasks, { description: "", category: "", subtasks: [], billable: true, hours: "" }],
      };
    case "REMOVE_TASK":
      return { ...state, tasks: state.tasks.filter((_, i) => i !== action.index) };
    case "SET_TASK": {
      const tasks = [...state.tasks];
      tasks[action.index] = { ...tasks[action.index], [action.field]: action.value };
      return { ...state, tasks };
    }

    case "ADD_SUBTASK": {
      const tasks = [...state.tasks];
      tasks[action.taskIndex] = {
        ...tasks[action.taskIndex],
        subtasks: [...tasks[action.taskIndex].subtasks, ""],
      };
      return { ...state, tasks };
    }
    case "REMOVE_SUBTASK": {
      const tasks = [...state.tasks];
      tasks[action.taskIndex] = {
        ...tasks[action.taskIndex],
        subtasks: tasks[action.taskIndex].subtasks.filter((_, i) => i !== action.subtaskIndex),
      };
      return { ...state, tasks };
    }
    case "SET_SUBTASK": {
      const tasks = [...state.tasks];
      const subtasks = [...tasks[action.taskIndex].subtasks];
      subtasks[action.subtaskIndex] = action.value;
      tasks[action.taskIndex] = { ...tasks[action.taskIndex], subtasks };
      return { ...state, tasks };
    }

    case "ADD_RESOURCE":
      return { ...state, resources: [...state.resources, ""] };
    case "REMOVE_RESOURCE":
      return { ...state, resources: state.resources.filter((_, i) => i !== action.index) };
    case "SET_RESOURCE": {
      const resources = [...state.resources];
      resources[action.index] = action.value;
      return { ...state, resources };
    }

    default:
      return state;
  }
}

function parseDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}`);
}

export default function EntryForm() {
  const [state, dispatch] = useReducer(formReducer, initialState);
  const { user } = useAuth();
  const router = useRouter();

  const calculatedHours = useMemo(() => {
    if (!state.checkIn || !state.checkOut) return null;
    const checkIn = parseDateTime(state.date, state.checkIn);
    const checkOut = parseDateTime(state.date, state.checkOut);
    const breaks: Break[] = state.breaks
      .filter((b) => b.start && b.end)
      .map((b) => ({
        start: parseDateTime(state.date, b.start),
        end: parseDateTime(state.date, b.end),
      }));
    const tasks: Task[] = state.tasks.map((t) => ({
      ...t,
      category: t.category.startsWith("#") ? t.category : `#${t.category}`,
      hours: parseFloat(t.hours) || 0,
    }));

    const totalHours = calculateTotalHours(checkIn, checkOut);
    const activeHours = calculateActiveHours(checkIn, checkOut, breaks);
    const billableHours = calculateBillableHours(tasks, activeHours);
    return { totalHours, activeHours, billableHours };
  }, [state.date, state.checkIn, state.checkOut, state.breaks, state.tasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const checkIn = parseDateTime(state.date, state.checkIn);
    const checkOut = state.checkOut ? parseDateTime(state.date, state.checkOut) : null;
    const breaks: Break[] = state.breaks
      .filter((b) => b.start && b.end)
      .map((b) => ({
        start: parseDateTime(state.date, b.start),
        end: parseDateTime(state.date, b.end),
      }));
    const tasks: Task[] = state.tasks
      .filter((t) => t.description.trim())
      .map((t) => ({
        ...t,
        category: t.category.startsWith("#") ? t.category : `#${t.category}`,
        subtasks: t.subtasks.filter((s) => s.trim()),
        hours: parseFloat(t.hours) || 0,
      }));
    const resources = state.resources.filter((r) => r.trim());

    const totalHours = calculateTotalHours(checkIn, checkOut);
    const activeHours = calculateActiveHours(checkIn, checkOut, breaks);
    const billableHours = calculateBillableHours(tasks, activeHours);

    await createEntry({
      userId: user.uid,
      date: new Date(state.date),
      checkIn,
      checkOut,
      breaks,
      tasks,
      resources,
      notes: state.notes,
      totalHours,
      activeHours,
      billableHours,
      status: checkOut ? "completed" : "in-progress",
    });

    router.push("/");
  };

  const inputClasses =
    "w-full bg-bg-base border border-border rounded-lg px-3 py-2.5 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all text-sm";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-8">
      {/* Date & Time Section */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FiClock className="w-4 h-4 text-accent" />
          Date & Time
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
              Date
            </label>
            <input
              type="date"
              value={state.date}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "date", value: e.target.value })}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
              Check In
            </label>
            <input
              type="time"
              value={state.checkIn}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "checkIn", value: e.target.value })}
              className={inputClasses}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">
              Check Out
            </label>
            <input
              type="time"
              value={state.checkOut}
              onChange={(e) => dispatch({ type: "SET_FIELD", field: "checkOut", value: e.target.value })}
              className={inputClasses}
            />
          </div>
        </div>

        {/* Calculated hours preview */}
        {calculatedHours && (
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-[family-name:var(--font-mono)]">
            <span className="text-text-secondary">
              Total: <span className="text-text-primary">{formatDuration(calculatedHours.totalHours)}</span>
            </span>
            <span className="text-text-secondary">
              Active: <span className="text-accent">{formatDuration(calculatedHours.activeHours)}</span>
            </span>
            <span className="text-text-secondary">
              Billable: <span className="text-success">{formatDuration(calculatedHours.billableHours)}</span>
            </span>
            {(() => {
              const assignedHours = state.tasks.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
              const unassigned = calculatedHours.activeHours - assignedHours;
              if (assignedHours > 0) return (
                <span className={`${unassigned < 0 ? "text-danger" : unassigned > 0.01 ? "text-warning" : "text-success"}`}>
                  {unassigned > 0.01
                    ? `${formatDuration(unassigned)} unassigned`
                    : unassigned < -0.01
                    ? `${formatDuration(Math.abs(unassigned))} over-assigned`
                    : "All hours assigned"}
                </span>
              );
              return null;
            })()}
          </div>
        )}
      </section>

      {/* Breaks Section */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Breaks</h2>
          <button
            type="button"
            onClick={() => dispatch({ type: "ADD_BREAK" })}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Break
          </button>
        </div>
        {state.breaks.length === 0 && (
          <p className="text-sm text-text-tertiary">No breaks added.</p>
        )}
        <div className="space-y-3">
          {state.breaks.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <input
                type="time"
                value={b.start}
                onChange={(e) => dispatch({ type: "SET_BREAK", index: i, field: "start", value: e.target.value })}
                className={inputClasses}
                placeholder="Start"
              />
              <span className="text-text-tertiary text-sm">to</span>
              <input
                type="time"
                value={b.end}
                onChange={(e) => dispatch({ type: "SET_BREAK", index: i, field: "end", value: e.target.value })}
                className={inputClasses}
                placeholder="End"
              />
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_BREAK", index: i })}
                className="text-text-tertiary hover:text-danger transition-colors p-1"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Tasks Section */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <FiHash className="w-4 h-4 text-accent" />
            Tasks
          </h2>
          <button
            type="button"
            onClick={() => dispatch({ type: "ADD_TASK" })}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>
        <div className="space-y-5">
          {state.tasks.map((task, ti) => (
            <div key={ti} className="bg-bg-base border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value={task.description}
                    onChange={(e) =>
                      dispatch({ type: "SET_TASK", index: ti, field: "description", value: e.target.value })
                    }
                    className={inputClasses}
                    placeholder="Task description"
                  />
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">#</span>
                      <input
                        type="text"
                        value={task.category.replace(/^#/, "")}
                        onChange={(e) =>
                          dispatch({ type: "SET_TASK", index: ti, field: "category", value: e.target.value })
                        }
                        className={`${inputClasses} pl-7`}
                        placeholder="category"
                      />
                    </div>
                    <div className="relative w-24">
                      <input
                        type="number"
                        step="0.25"
                        min="0"
                        value={task.hours}
                        onChange={(e) =>
                          dispatch({ type: "SET_TASK", index: ti, field: "hours", value: e.target.value })
                        }
                        className={`${inputClasses} pr-7 text-right`}
                        placeholder="0"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary text-xs">hrs</span>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={task.billable}
                        onChange={(e) =>
                          dispatch({ type: "SET_TASK", index: ti, field: "billable", value: e.target.checked })
                        }
                        className="rounded border-border accent-accent"
                      />
                      Billable
                    </label>
                  </div>
                </div>
                {state.tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_TASK", index: ti })}
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
                      onChange={(e) =>
                        dispatch({ type: "SET_SUBTASK", taskIndex: ti, subtaskIndex: si, value: e.target.value })
                      }
                      className={`${inputClasses} text-xs`}
                      placeholder="Subtask"
                    />
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "REMOVE_SUBTASK", taskIndex: ti, subtaskIndex: si })}
                      className="text-text-tertiary hover:text-danger transition-colors p-0.5"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => dispatch({ type: "ADD_SUBTASK", taskIndex: ti })}
                  className="flex items-center gap-1 text-xs text-text-tertiary hover:text-accent transition-colors"
                >
                  <FiPlus className="w-3 h-3" /> Add subtask
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Resources Section */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <FiLink className="w-4 h-4 text-accent" />
            Resources
          </h2>
          <button
            type="button"
            onClick={() => dispatch({ type: "ADD_RESOURCE" })}
            className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Link
          </button>
        </div>
        {state.resources.length === 0 && (
          <p className="text-sm text-text-tertiary">No resources added.</p>
        )}
        <div className="space-y-2">
          {state.resources.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="url"
                value={r}
                onChange={(e) => dispatch({ type: "SET_RESOURCE", index: i, value: e.target.value })}
                className={inputClasses}
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_RESOURCE", index: i })}
                className="text-text-tertiary hover:text-danger transition-colors p-1"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Notes Section */}
      <section className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-base font-semibold text-text-primary mb-4 flex items-center gap-2">
          <FiFileText className="w-4 h-4 text-accent" />
          Notes
        </h2>
        <textarea
          value={state.notes}
          onChange={(e) => dispatch({ type: "SET_FIELD", field: "notes", value: e.target.value })}
          className={`${inputClasses} min-h-[100px] resize-y`}
          placeholder="Any additional notes about this session..."
        />
      </section>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-accent hover:bg-accent/90 text-bg-base font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_0_24px_var(--accent-glow)]"
      >
        <FiSave className="w-4 h-4" />
        Save Entry
      </button>
    </form>
  );
}

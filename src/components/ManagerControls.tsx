"use client";

import { useAuth } from "@/lib/auth-context";
import { toggleTaskBillable, flagTask } from "@/lib/firestore";
import { formatDuration } from "@/lib/utils";
import type { Task } from "@/lib/types";
import { FiFlag, FiDollarSign } from "react-icons/fi";

interface ManagerControlsProps {
  entryId: string;
  tasks: Task[];
  onUpdate: () => void;
}

export default function ManagerControls({ entryId, tasks, onUpdate }: ManagerControlsProps) {
  const { user } = useAuth();
  if (user?.role !== "manager") return null;

  const handleBillableToggle = async (taskIndex: number, current: boolean) => {
    await toggleTaskBillable(entryId, taskIndex, !current);
    onUpdate();
  };

  const handleFlagToggle = async (taskIndex: number, current: boolean) => {
    await flagTask(entryId, taskIndex, !current);
    onUpdate();
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <h3 className="text-base font-semibold text-text-primary mb-4">Manager Controls</h3>
      <div className="space-y-3">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-center justify-between bg-bg-base border border-border rounded-lg p-3"
          >
            <div className="flex-1 mr-4 min-w-0">
              <span className="text-sm text-text-primary truncate block">
                {task.description || "Untitled task"}
              </span>
              {task.hours > 0 && (
                <span className="text-[10px] text-text-tertiary font-mono">{formatDuration(task.hours)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBillableToggle(i, task.billable)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all ${
                  task.billable
                    ? "bg-success/10 text-success border border-success/20"
                    : "bg-surface-elevated text-text-tertiary border border-border"
                }`}
              >
                <FiDollarSign className="w-3 h-3" />
                {task.billable ? "Billable" : "Non-billable"}
              </button>
              <button
                onClick={() => handleFlagToggle(i, !!task.flagged)}
                className={`p-1.5 rounded-md transition-all ${
                  task.flagged
                    ? "bg-danger/10 text-danger border border-danger/20"
                    : "bg-surface-elevated text-text-tertiary border border-border hover:text-warning"
                }`}
              >
                <FiFlag className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

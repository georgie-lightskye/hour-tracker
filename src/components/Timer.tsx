"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  getTimerState,
  setTimerState,
  clearTimerState,
  createEntry,
  updateEntry,
} from "@/lib/firestore";
import {
  formatTimerDisplay,
  getElapsedSeconds,
  calculateActiveHours,
  calculateTotalHours,
  calculateBillableHours,
} from "@/lib/utils";
import type { TimerState } from "@/lib/types";
import { FiPlay, FiPause, FiSquare, FiCoffee } from "react-icons/fi";

export default function Timer() {
  const { user } = useAuth();
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load timer state on mount
  useEffect(() => {
    if (!user) return;
    getTimerState(user.uid).then((state) => {
      setTimer(state);
      setLoading(false);
    });
  }, [user]);

  // Tick every second when running
  useEffect(() => {
    if (!timer?.isRunning || !timer.checkInTime) return;
    const tick = () => setElapsed(getElapsedSeconds(timer.checkInTime!, timer.breaks));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const isOnBreak =
    timer?.breaks.length && timer.breaks[timer.breaks.length - 1].end === null;

  const handleCheckIn = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const entryId = await createEntry({
      userId: user.uid,
      date: now,
      checkIn: now,
      checkOut: null,
      breaks: [],
      tasks: [],
      resources: [],
      notes: "",
      totalHours: 0,
      activeHours: 0,
      billableHours: 0,
      status: "in-progress",
    });
    const state: TimerState = {
      isRunning: true,
      checkInTime: now,
      breaks: [],
      currentEntryId: entryId,
    };
    await setTimerState(user.uid, state);
    setTimer(state);
  }, [user]);

  const handleBreakToggle = useCallback(async () => {
    if (!user || !timer) return;
    const now = new Date();
    let newBreaks = [...timer.breaks];

    if (isOnBreak) {
      // Resume from break
      newBreaks[newBreaks.length - 1] = {
        ...newBreaks[newBreaks.length - 1],
        end: now,
      };
    } else {
      // Start break
      newBreaks = [...newBreaks, { start: now, end: null }];
    }

    const state: TimerState = { ...timer, breaks: newBreaks };
    await setTimerState(user.uid, state);
    setTimer(state);
  }, [user, timer, isOnBreak]);

  const handleCheckOut = useCallback(async () => {
    if (!user || !timer?.checkInTime || !timer.currentEntryId) return;
    const now = new Date();

    // Close any open break
    const breaks = timer.breaks.map((b) =>
      b.end === null ? { ...b, end: now } : b
    );

    const totalHours = calculateTotalHours(timer.checkInTime, now);
    const activeHours = calculateActiveHours(timer.checkInTime, now, breaks);
    const billableHours = calculateBillableHours([], activeHours);

    await updateEntry(timer.currentEntryId, {
      checkOut: now,
      breaks,
      totalHours,
      activeHours,
      billableHours,
      status: "completed",
    });

    await clearTimerState(user.uid);
    setTimer(null);
    setElapsed(0);
  }, [user, timer]);

  if (loading) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 animate-pulse">
        <div className="h-10 bg-surface-elevated rounded w-48 mx-auto" />
      </div>
    );
  }

  // Not checked in
  if (!timer?.isRunning) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center">
        <p className="text-text-secondary text-sm mb-4">Not checked in</p>
        <button
          onClick={handleCheckIn}
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-bg-base font-semibold px-6 py-2.5 rounded-lg transition-all shadow-[0_0_20px_var(--accent-glow)]"
        >
          <FiPlay className="w-4 h-4" />
          Check In
        </button>
      </div>
    );
  }

  // Checked in - show timer
  return (
    <div
      className="bg-surface border border-border rounded-xl p-6 text-center"
      style={{ animation: "timer-glow 3s ease-in-out infinite" }}
    >
      {/* Timer display */}
      <div className="mb-1">
        <span
          className={`text-4xl font-bold font-mono tracking-wider ${
            isOnBreak ? "text-accent-secondary" : "text-accent"
          }`}
        >
          {formatTimerDisplay(elapsed)}
        </span>
      </div>

      {/* Status indicator */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <span
          className={`w-2 h-2 rounded-full ${
            isOnBreak
              ? "bg-accent-secondary"
              : "bg-accent animate-[pulse-dot_1.5s_ease-in-out_infinite]"
          }`}
        />
        <span className="text-xs text-text-secondary uppercase tracking-wider">
          {isOnBreak ? "On Break" : "Working"}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleBreakToggle}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isOnBreak
              ? "bg-accent-secondary/10 text-accent-secondary hover:bg-accent-secondary/20 border border-accent-secondary/20"
              : "bg-surface-elevated text-text-secondary hover:text-text-primary border border-border"
          }`}
        >
          {isOnBreak ? (
            <>
              <FiPlay className="w-3.5 h-3.5" /> Resume
            </>
          ) : (
            <>
              <FiCoffee className="w-3.5 h-3.5" /> Break
            </>
          )}
        </button>
        <button
          onClick={handleCheckOut}
          className="inline-flex items-center gap-2 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          <FiSquare className="w-3.5 h-3.5" />
          Check Out
        </button>
      </div>
    </div>
  );
}

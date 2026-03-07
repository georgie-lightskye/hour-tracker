import type { Break, Entry } from "./types";

export function calculateTotalHours(
  checkIn: Date,
  checkOut: Date | null
): number {
  if (!checkOut) return 0;
  return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
}

export function calculateBreakHours(breaks: Break[]): number {
  return breaks.reduce((total, b) => {
    if (!b.end) return total;
    return total + (b.end.getTime() - b.start.getTime()) / (1000 * 60 * 60);
  }, 0);
}

export function calculateActiveHours(
  checkIn: Date,
  checkOut: Date | null,
  breaks: Break[]
): number {
  const total = calculateTotalHours(checkIn, checkOut);
  if (total === 0) return 0;
  return Math.max(0, total - calculateBreakHours(breaks));
}

export function calculateBillableHours(
  tasks: { billable: boolean; hours: number }[],
  activeHours: number
): number {
  if (tasks.length === 0) return 0;
  const totalTaskHours = tasks.reduce((sum, t) => sum + t.hours, 0);
  // If no hours assigned to any task, fall back to equal division
  if (totalTaskHours === 0) {
    const billableCount = tasks.filter((t) => t.billable).length;
    return activeHours * (billableCount / tasks.length);
  }
  // Sum up hours from billable tasks only
  return tasks.reduce((sum, t) => (t.billable ? sum + t.hours : sum), 0);
}

export function formatDuration(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
    .toString()
    .padStart(2, "0")}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function getWeekRange(date: Date): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setDate(d.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getMonthRange(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export function generateCSV(entries: Entry[]): string {
  const headers = [
    "Date",
    "Check In",
    "Check Out",
    "Total Hours",
    "Active Hours",
    "Billable Hours",
    "Break Hours",
    "Tasks",
    "Categories",
    "Status",
  ];

  const rows = entries.map((entry) => [
    formatDate(entry.date),
    formatTime(entry.checkIn),
    entry.checkOut ? formatTime(entry.checkOut) : "In Progress",
    entry.totalHours.toFixed(2),
    entry.activeHours.toFixed(2),
    entry.billableHours.toFixed(2),
    calculateBreakHours(entry.breaks).toFixed(2),
    entry.tasks.map((t) => t.description).join("; "),
    [...new Set(entry.tasks.map((t) => t.category))].join("; "),
    entry.status,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return csvContent;
}

export function triggerDownload(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function cn(
  ...classes: (string | undefined | false | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function getElapsedSeconds(
  checkInTime: Date,
  breaks: Break[]
): number {
  const now = new Date();
  const elapsed = (now.getTime() - checkInTime.getTime()) / 1000;
  const breakSeconds = breaks.reduce((total, b) => {
    const end = b.end ? b.end.getTime() : now.getTime();
    return total + (end - b.start.getTime()) / 1000;
  }, 0);
  return Math.max(0, Math.floor(elapsed - breakSeconds));
}

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
    "Task",
    "Category",
    "Time",
    "Billable",
    "Subtasks",
    "Check In",
    "Check Out",
    "Active Hours",
    "Break Hours",
    "Total Hours",
    "Notes",
  ];

  const rows: string[][] = [];
  for (const entry of entries) {
    const breakHrs = calculateBreakHours(entry.breaks);
    const date = formatDate(entry.date);
    const checkIn = formatTime(entry.checkIn);
    const checkOut = entry.checkOut ? formatTime(entry.checkOut) : "In Progress";
    const active = formatDuration(entry.activeHours);
    const brk = formatDuration(breakHrs);
    const total = formatDuration(entry.totalHours);
    const notes = entry.notes;

    if (entry.tasks.length === 0) {
      rows.push([date, "", "", "", "", "", checkIn, checkOut, active, brk, total, notes]);
    } else {
      entry.tasks.forEach((t, i) => {
        rows.push([
          i === 0 ? date : "",
          t.description,
          t.category,
          formatDuration(t.hours),
          t.billable ? "Yes" : "No",
          t.subtasks.join(", "),
          i === 0 ? checkIn : "",
          i === 0 ? checkOut : "",
          i === 0 ? active : "",
          i === 0 ? brk : "",
          i === 0 ? total : "",
          i === 0 ? notes : "",
        ]);
      });
    }
  }

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

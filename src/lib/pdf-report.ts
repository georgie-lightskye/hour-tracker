import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Entry } from "./types";
import {
  formatDate,
  formatTime,
  formatDuration,
  calculateBreakHours,
} from "./utils";

interface ReportStats {
  totalHours: number;
  activeHours: number;
  billableHours: number;
  breakHours: number;
  totalEntries: number;
  totalTasks: number;
}

function computeStats(entries: Entry[]): ReportStats {
  const totalHours = entries.reduce((s, e) => s + e.totalHours, 0);
  const activeHours = entries.reduce((s, e) => s + e.activeHours, 0);
  const billableHours = entries.reduce((s, e) => s + e.billableHours, 0);
  const breakHours = entries.reduce(
    (s, e) => s + calculateBreakHours(e.breaks),
    0
  );
  const totalTasks = entries.reduce((s, e) => s + e.tasks.length, 0);
  return {
    totalHours,
    activeHours,
    billableHours,
    breakHours,
    totalEntries: entries.length,
    totalTasks,
  };
}

const COLORS = {
  bg: [9, 12, 16] as [number, number, number],
  surface: [19, 24, 32] as [number, number, number],
  accent: [240, 160, 48] as [number, number, number],
  text: [220, 225, 232] as [number, number, number],
  textDim: [140, 150, 165] as [number, number, number],
  border: [37, 45, 58] as [number, number, number],
  success: [74, 222, 128] as [number, number, number],
};

export function generatePDFReport(
  entries: Entry[],
  dateLabel: string
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Background
  function drawPageBg() {
    doc.setFillColor(...COLORS.bg);
    doc.rect(
      0,
      0,
      doc.internal.pageSize.getWidth(),
      doc.internal.pageSize.getHeight(),
      "F"
    );
  }
  drawPageBg();

  // Header
  doc.setFillColor(...COLORS.surface);
  doc.roundedRect(margin, y, contentWidth, 28, 3, 3, "F");

  doc.setTextColor(...COLORS.accent);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Work Report", margin + 8, y + 12);

  doc.setTextColor(...COLORS.textDim);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const periodLabel = dateLabel.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  doc.text(`Period: ${periodLabel}`, margin + 8, y + 20);

  const generated = `Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  doc.text(generated, pageWidth - margin - 8, y + 20, { align: "right" });

  y += 36;

  // Stats overview
  const stats = computeStats(entries);
  const statItems = [
    { label: "Total Hours", value: formatDuration(stats.totalHours) },
    { label: "Active Hours", value: formatDuration(stats.activeHours) },
    { label: "Break Hours", value: formatDuration(stats.breakHours) },
    { label: "Billable Hours", value: formatDuration(stats.billableHours) },
    { label: "Sessions", value: String(stats.totalEntries) },
    { label: "Tasks", value: String(stats.totalTasks) },
  ];

  const statBoxW = (contentWidth - 8) / 3;
  const statBoxH = 20;

  statItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + col * (statBoxW + 4);
    const sy = y + row * (statBoxH + 4);

    doc.setFillColor(...COLORS.surface);
    doc.roundedRect(x, sy, statBoxW, statBoxH, 2, 2, "F");

    doc.setTextColor(...COLORS.textDim);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(item.label.toUpperCase(), x + 6, sy + 8);

    doc.setTextColor(...COLORS.accent);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(item.value, x + 6, sy + 16);
  });

  y += Math.ceil(statItems.length / 3) * (statBoxH + 4) + 8;

  // Billable percentage bar
  const billablePct =
    stats.activeHours > 0
      ? (stats.billableHours / stats.activeHours) * 100
      : 0;

  doc.setFillColor(...COLORS.surface);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, "F");

  doc.setTextColor(...COLORS.textDim);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("BILLABLE RATE", margin + 6, y + 5.5);

  doc.setTextColor(...COLORS.accent);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${billablePct.toFixed(0)}%`, margin + 6, y + 11.5);

  // Bar background
  const barX = margin + 36;
  const barW = contentWidth - 44;
  const barH = 4;
  const barY = y + 8;

  doc.setFillColor(...COLORS.border);
  doc.roundedRect(barX, barY, barW, barH, 2, 2, "F");

  // Bar fill
  if (billablePct > 0) {
    const fillW = Math.max(4, (barW * billablePct) / 100);
    doc.setFillColor(...COLORS.success);
    doc.roundedRect(barX, barY, fillW, barH, 2, 2, "F");
  }

  y += 22;

  // Section: Daily Breakdown
  doc.setTextColor(...COLORS.accent);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Daily Breakdown", margin, y);
  y += 6;

  const sorted = [...entries].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  for (const entry of sorted) {
    const breakHrs = calculateBreakHours(entry.breaks);
    const neededHeight = 28 + entry.tasks.length * 6 + (entry.breaks.length > 0 ? 10 : 0) + (entry.notes ? 10 : 0);

    if (y + neededHeight > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      drawPageBg();
      y = margin;
    }

    // Entry card background
    doc.setFillColor(...COLORS.surface);
    doc.roundedRect(margin, y, contentWidth, neededHeight, 2, 2, "F");

    // Date header
    doc.setTextColor(...COLORS.text);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(formatDate(entry.date), margin + 6, y + 7);

    // Time range
    doc.setTextColor(...COLORS.textDim);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const timeRange = `${formatTime(entry.checkIn)} - ${entry.checkOut ? formatTime(entry.checkOut) : "In Progress"}`;
    doc.text(timeRange, margin + 6, y + 13);

    // Stats on the right
    const statsStr = `Total: ${formatDuration(entry.totalHours)}  |  Active: ${formatDuration(entry.activeHours)}  |  Break: ${formatDuration(breakHrs)}  |  Billable: ${formatDuration(entry.billableHours)}`;
    doc.setFontSize(7);
    doc.text(statsStr, pageWidth - margin - 6, y + 7, { align: "right" });

    let ey = y + 18;

    // Break details
    if (entry.breaks.length > 0) {
      doc.setTextColor(...COLORS.textDim);
      doc.setFontSize(7);
      const breakStrs = entry.breaks.map((b) => {
        const start = formatTime(b.start);
        const end = b.end ? formatTime(b.end) : "ongoing";
        const dur = b.end
          ? formatDuration((b.end.getTime() - b.start.getTime()) / 3600000)
          : "";
        return `${start} - ${end}${dur ? ` (${dur})` : ""}`;
      });
      doc.text(`Breaks: ${breakStrs.join("  /  ")}`, margin + 6, ey);
      ey += 6;
    }

    // Tasks
    if (entry.tasks.length > 0) {
      entry.tasks.forEach((task) => {
        doc.setTextColor(...COLORS.text);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        const taskLine = `${task.description}`;
        doc.text(taskLine, margin + 10, ey);

        // Category + hours on right
        const meta: string[] = [];
        if (task.category) meta.push(task.category);
        meta.push(formatDuration(task.hours));
        if (task.billable) meta.push("billable");

        doc.setTextColor(...COLORS.textDim);
        doc.setFontSize(7);
        doc.text(meta.join("  |  "), pageWidth - margin - 6, ey, {
          align: "right",
        });

        ey += 5;

        // Subtasks
        if (task.subtasks.length > 0) {
          doc.setTextColor(...COLORS.textDim);
          doc.setFontSize(6.5);
          task.subtasks.forEach((sub) => {
            doc.text(`  - ${sub}`, margin + 14, ey);
            ey += 4;
          });
        }
      });
    }

    // Notes
    if (entry.notes) {
      doc.setTextColor(...COLORS.textDim);
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      const noteLines = doc.splitTextToSize(
        `Notes: ${entry.notes}`,
        contentWidth - 16
      );
      doc.text(noteLines, margin + 6, ey);
      ey += noteLines.length * 4;
    }

    y += neededHeight + 4;
  }

  // Category summary table
  const catMap = new Map<string, { hours: number; billable: number }>();
  for (const entry of entries) {
    const totalTaskHours = entry.tasks.reduce((s, t) => s + (t.hours || 0), 0);
    const useWeights = totalTaskHours > 0;
    const perTaskHours =
      entry.tasks.length > 0 ? entry.activeHours / entry.tasks.length : 0;

    for (const t of entry.tasks) {
      const cat = t.category || "#uncategorized";
      const hrs = useWeights ? t.hours || 0 : perTaskHours;
      const prev = catMap.get(cat) || { hours: 0, billable: 0 };
      prev.hours += hrs;
      if (t.billable) prev.billable += hrs;
      catMap.set(cat, prev);
    }
  }

  if (catMap.size > 0) {
    if (y + 30 > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      drawPageBg();
      y = margin;
    }

    doc.setTextColor(...COLORS.accent);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Category Summary", margin, y);
    y += 4;

    const catRows = Array.from(catMap.entries())
      .sort((a, b) => b[1].hours - a[1].hours)
      .map(([cat, data]) => [
        cat,
        formatDuration(data.hours),
        formatDuration(data.billable),
        `${data.hours > 0 ? ((data.billable / data.hours) * 100).toFixed(0) : 0}%`,
      ]);

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Category", "Hours", "Billable", "Billable %"]],
      body: catRows,
      theme: "plain",
      styles: {
        fillColor: COLORS.surface,
        textColor: COLORS.text,
        fontSize: 8,
        cellPadding: 3,
        lineColor: COLORS.border,
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: COLORS.border,
        textColor: COLORS.accent,
        fontStyle: "bold",
        fontSize: 7,
      },
      alternateRowStyles: {
        fillColor: [15, 20, 28],
      },
    });
  }

  // Footer on every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(...COLORS.textDim);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`work-report-${dateLabel}.pdf`);
}

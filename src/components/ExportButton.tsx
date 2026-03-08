"use client";

import type { Entry } from "@/lib/types";
import { generateCSV, triggerDownload } from "@/lib/utils";
import { generatePDFReport } from "@/lib/pdf-report";
import { FiDownload, FiFileText } from "react-icons/fi";

interface ExportButtonProps {
  entries: Entry[];
  dateLabel?: string;
}

export default function ExportButton({ entries, dateLabel = "report" }: ExportButtonProps) {
  const handleCSV = () => {
    const csv = generateCSV(entries);
    triggerDownload(csv, `hour-tracker-${dateLabel}.csv`, "text/csv");
  };

  const handlePDF = () => {
    generatePDFReport(entries, dateLabel);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCSV}
        disabled={entries.length === 0}
        className="flex items-center gap-1.5 text-xs bg-surface border border-border rounded-lg px-3 py-2 text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FiDownload className="w-3.5 h-3.5" />
        Export CSV
      </button>
      <button
        onClick={handlePDF}
        disabled={entries.length === 0}
        className="flex items-center gap-1.5 text-xs bg-surface border border-border rounded-lg px-3 py-2 text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <FiFileText className="w-3.5 h-3.5" />
        Export PDF
      </button>
    </div>
  );
}

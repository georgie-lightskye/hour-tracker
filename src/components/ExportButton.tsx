"use client";

import type { Entry } from "@/lib/types";
import { generateCSV, triggerDownload } from "@/lib/utils";
import { FiDownload, FiPrinter } from "react-icons/fi";

interface ExportButtonProps {
  entries: Entry[];
  dateLabel?: string;
}

export default function ExportButton({ entries, dateLabel = "report" }: ExportButtonProps) {
  const handleCSV = () => {
    const csv = generateCSV(entries);
    triggerDownload(csv, `hour-tracker-${dateLabel}.csv`, "text/csv");
  };

  const handlePrint = () => {
    window.print();
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
        onClick={handlePrint}
        className="flex items-center gap-1.5 text-xs bg-surface border border-border rounded-lg px-3 py-2 text-text-secondary hover:text-text-primary hover:border-accent/30 transition-all"
      >
        <FiPrinter className="w-3.5 h-3.5" />
        Print
      </button>
    </div>
  );
}

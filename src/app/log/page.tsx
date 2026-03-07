"use client";

import AuthGuard from "@/components/AuthGuard";
import EntryForm from "@/components/EntryForm";

export default function LogPage() {
  return (
    <AuthGuard requiredRole="developer">
      <div className="animate-[fadeInUp_0.5s_ease-out]">
        <h1 className="text-2xl font-bold text-text-primary mb-1">Log Entry</h1>
        <p className="text-text-secondary text-sm mb-8">Record your work session</p>
        <EntryForm />
      </div>
    </AuthGuard>
  );
}

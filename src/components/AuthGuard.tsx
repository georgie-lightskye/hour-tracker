"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: "developer" | "manager";
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span className="text-[var(--text-secondary)] font-[family-name:var(--font-mono)] text-sm">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--bg-base)]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            Access Denied
          </h2>
          <p className="text-[var(--text-secondary)]">
            You don&apos;t have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

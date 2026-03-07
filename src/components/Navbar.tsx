"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  FiClock,
  FiHome,
  FiPlusCircle,
  FiBarChart2,
  FiLogOut,
  FiUser,
} from "react-icons/fi";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: FiHome },
  { href: "/log", label: "Log Entry", icon: FiPlusCircle, role: "developer" as const },
  { href: "/summary", label: "Summary", icon: FiBarChart2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex flex-col z-50 no-print">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shadow-[0_0_16px_var(--accent-glow)]">
            <FiClock className="w-5 h-5 text-accent" />
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">
            Hour Tracker
          </span>
        </Link>
      </div>

      {/* Navigation links */}
      <div className="flex-1 px-3 space-y-1">
        {navItems
          .filter((item) => !item.role || item.role === user.role)
          .map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-accent/10 text-accent border-l-2 border-accent"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-elevated"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
      </div>

      {/* User info + sign out */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
            <FiUser className="w-4 h-4 text-text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user.displayName || user.email}
            </p>
            <p className="text-xs text-text-tertiary capitalize">{user.role}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-sm text-text-secondary hover:text-danger transition-colors w-full px-1"
        >
          <FiLogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </nav>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import Navbar from "./Navbar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <AuthProvider>
      {isLoginPage ? (
        children
      ) : (
        <div className="flex min-h-screen">
          <Navbar />
          <main className="flex-1 ml-60 p-8 overflow-auto">{children}</main>
        </div>
      )}
    </AuthProvider>
  );
}

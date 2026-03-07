"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { FiClock, FiMail, FiLock, FiArrowRight } from "react-icons/fi";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      router.push("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(240, 160, 48, 0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-10 animate-[fadeInUp_0.6s_ease-out]">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--surface)] border border-[var(--border)] mb-5 shadow-[0_0_32px_var(--accent-glow)]">
            <FiClock className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] font-[family-name:var(--font-heading)]">
            Hour Tracker
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 text-sm">
            Track your hours. Measure your impact.
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl animate-[fadeInUp_0.6s_ease-out_0.15s_both]"
        >
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all text-sm"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] w-4 h-4" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all text-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/20 rounded-lg text-[var(--danger)] text-sm">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[var(--bg-base)] font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_24px_var(--accent-glow)]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-[var(--bg-base)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <FiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[var(--text-tertiary)] text-xs mt-6 animate-[fadeInUp_0.6s_ease-out_0.3s_both]">
          Access restricted to authorized users only.
        </p>
      </div>
    </div>
  );
}

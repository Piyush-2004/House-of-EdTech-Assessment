"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserSession } from "@/lib/auth";
import { LogOut, User, LayoutDashboard, Shield } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  user: UserSession | null;
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <header className="sticky top-0 z-50 w-full px-6 py-4 bg-white/80 border-b border-slate-200 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            PrepAI
          </span>
          <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded uppercase tracking-wider">
            AI-Powered
          </span>
        </Link>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              {/* Candidate Dashboard */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <span>Dashboard</span>
              </Link>

              {/* Admin Panel (visible to admin or interviewer) */}
              {(user.role === "admin" || user.role === "interviewer") && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
                >
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User badge */}
              <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                  <span className="text-[10px] text-slate-500 capitalize">{user.role}</span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 active:scale-95 transition-all disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                <span>{loading ? "Leaving..." : "Logout"}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm active:scale-95 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

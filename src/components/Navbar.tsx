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
    <header className="sticky top-0 z-50 w-full px-6 py-4 bg-[#090d16]/80 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            PrepAI
          </span>
          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
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
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                <span>Dashboard</span>
              </Link>

              {/* Admin Panel (visible to admin or interviewer) */}
              {(user.role === "admin" || user.role === "interviewer") && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Admin Panel</span>
                </Link>
              )}

              {/* User badge */}
              <div className="flex items-center gap-2 border-l border-white/10 pl-6">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{user.role}</span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                  <User className="w-4 h-4 text-indigo-400" />
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 border border-white/5 active:scale-95 transition-all disabled:opacity-50"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>{loading ? "Leaving..." : "Logout"}</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-accent text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-95 transition-all"
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

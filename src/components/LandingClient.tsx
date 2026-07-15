"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  ShieldAlert, 
  Terminal, 
  TrendingUp, 
  ChevronRight,
  Database
} from "lucide-react";
import gsap from "gsap";
import ConstellationBackground from "./ConstellationBackground";

interface LandingClientProps {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  } | null;
}

export default function LandingClient({ user }: LandingClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // GSAP entrance staggers timeline
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.2)" } });

    tl.fromTo(".hero-animate-badge", 
      { scale: 0.8, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.6, delay: 0.2 }
    )
    .fromTo(".hero-animate-title", 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.8 }, 
      "-=0.4"
    )
    .fromTo(".hero-animate-desc", 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6 }, 
      "-=0.5"
    )
    .fromTo(".hero-animate-ctas", 
      { y: 15, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5 }, 
      "-=0.4"
    )
    .fromTo(".feature-card-animate", 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.12 }, 
      "-=0.3"
    )
    .fromTo(".tech-block-animate", 
      { y: 20, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" }, 
      "-=0.2"
    );

  }, []);

  return (
    <div ref={containerRef} className="relative space-y-20 py-12 md:py-20 max-w-6xl mx-auto z-10">
      
      {/* Three.js Constellation Background */}
      <ConstellationBackground />
      
      {/* Hero Header Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="hero-animate-badge inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>PrepAI - Relational & Agentic Interviewer</span>
        </div>
        
        <h1 className="hero-animate-title text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
          Ace Your Next Interview with{" "}
          <span className="bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
            AI Precision
          </span>
        </h1>
        
        <p className="hero-animate-desc text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Upload any Job Description and your resume. Get a tailored, question-by-question mock interview, instant scoring, and a comprehensive gap report powered by Gemini.
        </p>

        <div className="hero-animate-ctas flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white active:scale-95 transition-all shadow-md shadow-indigo-600/10"
            >
              <span>Go to Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold text-white active:scale-95 transition-all shadow-md shadow-indigo-600/10"
              >
                <span>Get Started Free</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 font-semibold text-slate-600 hover:text-slate-800 transition-all active:scale-95 shadow-sm"
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Fit Match Analytics */}
        <div className="feature-card-animate glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Interactive Fit Match</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Submit answers technical or behavioral, and get graded on a scale of 0 to 100 on semantic match and keyword coverage.
          </p>
        </div>

        {/* Caching & Speed */}
        <div className="feature-card-animate glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Deduplication Caching</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Analyzes and hashes JDs using SHA-256 in PostgreSQL. Repeated interview requests load instantly with zero token cost.
          </p>
        </div>

        {/* Security & Guards */}
        <div className="feature-card-animate glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Production Guardrails</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            DB-backed sliding rate-limits protect Gemini APIs from abuse, coupled with structured schema validators that eliminate hallucinated grading.
          </p>
        </div>
      </div>

      {/* Technical Architecture Block */}
      <div className="tech-block-animate glass-panel p-8 rounded-3xl relative overflow-hidden border border-slate-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
            <Terminal className="w-4 h-4" />
            <span>Under the Hood</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Robust Next.js & PostgreSQL Foundation</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            PrepAI is built for production environments using TypeScript, Next.js 16 App Router, Jose-based Edge JWT cookie authorization, and Prisma 7 PostgreSQL schemas. Secure session checks guard candidate data.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["NextJS 16", "PostgreSQL", "Prisma 7", "JWT Auth", "Gemini 1.5", "Tailwind CSS v4"].map((tag, idx) => (
              <span 
                key={idx}
                className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 border border-slate-200 text-slate-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

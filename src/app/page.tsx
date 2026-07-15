import Link from "next/link";
import { getSession } from "@/lib/auth";
import { 
  Sparkles, 
  ShieldAlert, 
  Terminal, 
  TrendingUp, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight,
  Database
} from "lucide-react";

export default async function Home() {
  const user = await getSession();

  return (
    <div className="space-y-20 py-12 md:py-20 max-w-6xl mx-auto animate-fade-in">
      
      {/* Hero Header Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PrepAI - Relational & Agentic Interviewer</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none">
          Ace Your Next Interview with{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
            AI Precision
          </span>
        </h1>
        
        <p className="text-slate-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Upload any Job Description and your resume. Get a tailored, question-by-question mock interview, instant scoring, and a comprehensive gap report powered by Gemini.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
            >
              <span>Go to Dashboard</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="flex items-center gap-1.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-semibold text-white hover:opacity-95 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
              >
                <span>Get Started Free</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 font-semibold text-slate-300 hover:text-white transition-all active:scale-95"
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
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Interactive Fit Match</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Submit answers technical or behavioral, and get graded on a scale of 0 to 100 on semantic match and keyword coverage.
          </p>
        </div>

        {/* Caching & Speed */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Deduplication Caching</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Analyzes and hashes JDs using SHA-256 in PostgreSQL. Repeated interview requests load instantly with zero token cost.
          </p>
        </div>

        {/* Security & Guards */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Production Guardrails</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            DB-backed sliding rate-limits protect Gemini APIs from abuse, coupled with structured schema validators that eliminate hallucinated grading.
          </p>
        </div>
      </div>

      {/* Technical Architecture Block */}
      <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full -mr-20 -mt-20" />
        <div className="max-w-xl space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
            <Terminal className="w-4 h-4" />
            <span>Under the Hood</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Robust Next.js & PostgreSQL Foundation</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            PrepAI is built for production environments using TypeScript, Next.js 16 App Router, Jose-based Edge JWT cookie authorization, and Prisma 7 PostgreSQL schemas. Secure session checks guard candidate data.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {["NextJS 16", "PostgreSQL", "Prisma 7", "JWT Auth", "Gemini 1.5", "Tailwind CSS v4"].map((tag, idx) => (
              <span 
                key={idx}
                className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300"
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

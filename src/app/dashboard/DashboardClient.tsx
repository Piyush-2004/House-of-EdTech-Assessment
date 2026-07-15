"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserSession } from "@/lib/auth";
import gsap from "gsap";
import { 
  Play, 
  FileText, 
  Plus, 
  Award, 
  Calendar, 
  Layers, 
  TrendingUp, 
  X,
  Sparkles,
  ClipboardList
} from "lucide-react";

interface DashboardClientProps {
  initialSessions: any[];
  user: UserSession;
}

export default function DashboardClient({ initialSessions, user }: DashboardClientProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    gsap.fromTo(".dash-animate-header",
      { y: -15, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
    );
    gsap.fromTo(".dash-animate-card",
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: "back.out(1.2)" }
    );
  }, []);

  // Form State
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [questionCount, setQuestionCount] = useState(5);

  // Computations
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalSessions = sessions.length;
  const inProgressSessions = sessions.filter((s) => s.status === "in_progress");

  const averageScore = completedSessions.length
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.score, 0) / completedSessions.length)
    : 0;

  // Handle New Session Submission
  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          company,
          jdText,
          resumeText,
          questionCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create session.");
      }

      setIsModalOpen(false);
      router.push(`/interview/${data.sessionId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Generate Custom SVG Line Chart coordinates
  const renderScoreChart = () => {
    const chartData = [...completedSessions]
      .reverse() // chronological
      .map((s, idx) => ({ index: idx, score: s.score }));

    if (chartData.length < 2) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-sm">
          <TrendingUp className="w-8 h-8 opacity-40 mb-2" />
          <span>Take at least 2 interviews to see your progress chart</span>
        </div>
      );
    }

    const width = 500;
    const height = 150;
    const padding = 30;

    const getX = (index: number) => 
      padding + (index / (chartData.length - 1)) * (width - padding * 2);
    const getY = (score: number) => 
      height - padding - (score / 100) * (height - padding * 2);

    let pathD = `M ${getX(0)} ${getY(chartData[0].score)}`;
    let areaD = `M ${getX(0)} ${height - padding} L ${getX(0)} ${getY(chartData[0].score)}`;

    for (let i = 1; i < chartData.length; i++) {
      const x = getX(i);
      const y = getY(chartData[i].score);
      pathD += ` L ${x} ${y}`;
      areaD += ` L ${x} ${y}`;
    }

    areaD += ` L ${getX(chartData.length - 1)} ${height - padding} Z`;

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[400px]">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
          
          {/* Y Axis Gridlines (0, 50, 100) */}
          <line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={getY(50)} x2={width - padding} y2={getY(50)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={getY(100)} x2={width - padding} y2={getY(100)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

          {/* Area under the line */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Sparkline Path */}
          <path d={pathD} fill="none" stroke="url(#lineGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {chartData.map((d, idx) => (
            <g key={idx} className="group/point cursor-pointer">
              <circle
                cx={getX(d.index)}
                cy={getY(d.score)}
                r="5"
                className="fill-indigo-500 stroke-slate-900 stroke-[2] hover:r-7 transition-all duration-150"
              />
              {/* Tooltip on circle */}
              <text
                x={getX(d.index)}
                y={getY(d.score) - 10}
                textAnchor="middle"
                className="fill-slate-300 text-[10px] font-bold opacity-0 group-hover/point:opacity-100 bg-slate-950 px-1 py-0.5 rounded transition-opacity pointer-events-none"
              >
                {d.score}%
              </text>
            </g>
          ))}
          
          {/* Labels */}
          <text x={padding} y={getY(0) + 18} className="fill-slate-500 text-[9px] font-semibold">Start</text>
          <text x={width - padding} y={getY(0) + 18} textAnchor="end" className="fill-slate-500 text-[9px] font-semibold">Current</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Statistics Cards & Progress Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics Cards Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-1">
          {/* Card: Overall Score */}
          <div className="dash-animate-card glass-panel p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Score</span>
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-800">{averageScore}%</span>
              <p className="text-[11px] text-slate-500 mt-1">Average candidate fit score</p>
            </div>
          </div>

          {/* Card: Total Interviews */}
          <div className="dash-animate-card glass-panel p-5 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Mock</span>
              <ClipboardList className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-4">
              <span className="text-4xl font-extrabold text-slate-800">{totalSessions}</span>
              <p className="text-[11px] text-slate-500 mt-1">{completedSessions.length} finished / {inProgressSessions.length} in progress</p>
            </div>
          </div>
        </div>

        {/* Chart Card */}
        <div className="dash-animate-card glass-panel p-5 rounded-2xl lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Score Improvement Trend</span>
            </h3>
            <span className="text-xs text-slate-500">Completed Sessions</span>
          </div>
          <div className="mt-4 flex-1 flex items-center">
            {renderScoreChart()}
          </div>
        </div>
      </div>

      {/* Mock Interviews Section */}
      <div className="dash-animate-header space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Interview Sessions</span>
          </h2>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-sm font-semibold text-white rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Start Practice</span>
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="dash-animate-card glass-panel p-12 rounded-2xl text-center space-y-4">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 text-slate-500">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-800">No interview sessions yet</h3>
              <p className="text-sm text-slate-500 mt-1">
                Upload your resume and a target job description to trigger your first interactive AI mock interview.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold rounded-xl text-white active:scale-95 transition-all"
            >
              Start Your First Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => {
              const formattedDate = new Date(session.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div key={session.id} className="dash-animate-card glass-panel p-6 rounded-2xl flex flex-col justify-between gap-6 hover:translate-y-[-2px]">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 leading-snug">
                          {session.jd.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500">
                          {session.jd.company}
                        </p>
                      </div>

                      {/* Status / Score Badge */}
                      {session.status === "completed" ? (
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black text-emerald-600">{session.score}%</span>
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Score</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded uppercase tracking-wider animate-pulse">
                          In Progress
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {formattedDate}
                      </span>
                      <span className="text-slate-200">|</span>
                      <span>
                        {session.scoredAnswers.length} / {session.questions.length} Answered
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end border-t border-slate-200 pt-4 mt-2">
                    {session.status === "completed" ? (
                      <Link
                        href={`/report/${session.id}`}
                        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View Gap Report</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/interview/${session.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all active:scale-95"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-950" />
                        <span>Resume Interview</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Start Interview Modal / Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl glass-panel rounded-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 relative bg-white border border-slate-200 shadow-xl">
            
            {/* Close Button */}
            <button
              onClick={() => !loading && setIsModalOpen(false)}
              disabled={loading}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Setup Mock Interview</h3>
                <p className="text-xs text-slate-500 mt-0.5">Define your target job to customize questions.</p>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleStartInterview} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Target Job Title
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    placeholder="e.g. Fullstack Engineer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                    placeholder="e.g. Google"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Job Description (JD)
                </label>
                <textarea
                  required
                  disabled={loading}
                  rows={4}
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-mono placeholder:font-sans"
                  placeholder="Paste the core requirements, skills list, or overall description from the JD..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Your Resume Profile
                </label>
                <textarea
                  required
                  disabled={loading}
                  rows={4}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-mono placeholder:font-sans"
                  placeholder="Paste your resume content, experience descriptions, and key skills..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Mock Interview Length
                  </label>
                  <select
                    disabled={loading}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  >
                    <option value={3}>Short (3 Questions)</option>
                    <option value={5}>Standard (5 Questions)</option>
                    <option value={10}>Comprehensive (10 Questions)</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                        <span>Generating tailored session...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Start Mock Interview</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

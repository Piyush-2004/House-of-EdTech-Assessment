"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Award, 
  ArrowLeft, 
  HelpCircle, 
  AlertTriangle, 
  BookOpen, 
  ChevronRight,
  Calendar
} from "lucide-react";
import gsap from "gsap";
import ThreeScoreGauge from "./ThreeScoreGauge";

interface ReportClientProps {
  session: any;
  formattedDate: string;
}

export default function ReportClient({ session, formattedDate }: ReportClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // GSAP load reveal staggers
    const tl = gsap.timeline({ defaults: { ease: "back.out(1.2)" } });

    tl.fromTo(".rep-animate-header", 
      { y: -15, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5 }
    )
    .fromTo(".rep-animate-card", 
      { y: 25, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 },
      "-=0.3"
    );
  }, []);

  // Score styling color heuristics for light mode
  const scoreColor = 
    session.score >= 80 ? "text-emerald-600 border-emerald-200" :
    session.score >= 60 ? "text-amber-600 border-amber-200" :
    "text-rose-600 border-rose-200";

  return (
    <div ref={containerRef} className="max-w-5xl mx-auto space-y-8 pb-16 z-10">
      
      {/* Navigation Header */}
      <div className="rep-animate-header flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          Interviewed on {formattedDate}
        </span>
      </div>

      {/* Main Fit Score Panel */}
      <div className="rep-animate-card glass-panel p-6 md:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-white border border-slate-200">
        
        {/* Three.js Torus Glass Progress Indicator */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-slate-200">
          <ThreeScoreGauge score={session.score} />
          
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Match Level</span>
            <p className={`text-base font-bold mt-0.5 ${scoreColor.split(" ")[0]}`}>
              {session.score >= 80 ? "Strong Candidate Fit" :
               session.score >= 60 ? "Moderate Requirements Fit" :
               "Major Skill Gaps Detected"}
            </p>
          </div>
        </div>

        {/* Feedback Summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-base text-slate-800">Recruiter's Overall Feedback</h3>
          </div>
          <p className="text-slate-600 text-sm md:text-base leading-relaxed font-medium">
            {session.feedbackSummary || "The mock interview evaluation report is compiled. Focus on reinforcing structured engineering concepts and clarifying database indexing guidelines during mock tests."}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Role: <strong className="text-slate-850 font-bold">{session.jd.title}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Target: <strong className="text-slate-850 font-bold">{session.jd.company}</strong></span>
          </div>
        </div>
      </div>

      {/* Gap Analysis & Study Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Skills Gap List */}
        <div className="rep-animate-card glass-panel p-6 rounded-2xl space-y-4 bg-white">
          <div className="flex items-center gap-2 text-rose-600 border-b border-slate-100 pb-3">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">Identified Gaps</h3>
          </div>
          
          <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
            {session.gapAnalysis ? (
              <div className="prose prose-slate max-w-none text-slate-600 text-sm whitespace-pre-line leading-relaxed font-medium">
                {session.gapAnalysis}
              </div>
            ) : (
              <p className="text-slate-500 italic">No major gaps identified. Re-run with harder questions for advanced evaluation.</p>
            )}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="rep-animate-card glass-panel p-6 rounded-2xl space-y-4 bg-white">
          <div className="flex items-center gap-2 text-emerald-600 border-b border-slate-100 pb-3">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800">Study Roadmap & Actions</h3>
          </div>
          
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                1
              </div>
              <p className="leading-relaxed">
                <strong>Study Missing Keywords:</strong> Review the expected terminology list on items where you scored below 70% (expand question nodes below).
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                2
              </div>
              <p className="leading-relaxed">
                <strong>Refine Technical Explanations:</strong> Emphasize architectural trade-offs, scaling limits, and security headers during practice.
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                3
              </div>
              <p className="leading-relaxed">
                <strong>Resume Retake:</strong> Start another session with the same JD to trace improvement and confirm you've bridged these gaps.
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Question-by-Question Evaluation Breakdown */}
      <div className="rep-animate-card space-y-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <span>Question-by-Question Breakdown</span>
        </h3>

        <div className="space-y-4">
          {session.questions.map((question: any, idx: number) => {
            const answer = session.scoredAnswers.find(
              (sa: any) => sa.questionId === question.id
            );

            const qScoreColor = answer 
              ? answer.score >= 80 ? "text-emerald-600" :
                answer.score >= 60 ? "text-amber-600" :
                "text-rose-600"
              : "text-slate-400";

            return (
              <details
                key={question.id}
                className="group glass-panel rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-slate-50/50 list-none select-none">
                  <div className="flex items-center gap-4 flex-1 pr-4">
                    <span className="text-xs font-bold text-slate-400 w-6">
                      Q{idx + 1}
                    </span>
                    <span className="font-bold text-sm md:text-base text-slate-800 text-left line-clamp-1 flex-1">
                      {question.questionText}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`text-sm font-black ${qScoreColor}`}>
                      {answer ? `${answer.score}/100` : "Skipped"}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-open:rotate-90 transition-transform duration-200" />
                  </div>
                </summary>

                {/* Details Accordion Content */}
                <div className="px-5 pb-6 border-t border-slate-200 bg-slate-50/50 space-y-5 pt-4 text-sm animate-fade-in">
                  
                  {/* Detailed Question text */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Interviewer Question</h5>
                    <p className="text-slate-800 font-bold">{question.questionText}</p>
                  </div>

                  {/* Expected Keywords */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expected Terminology / Concepts</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {question.expectedKeywords.split(",").map((kw: string, kIdx: number) => (
                        <span 
                          key={kIdx} 
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200"
                        >
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Candidate Answer */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Answer</h5>
                    <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                      {answer ? answer.answerText : <span className="text-slate-400 italic">No answer submitted.</span>}
                    </div>
                  </div>

                  {/* AI Evaluation */}
                  {answer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Detailed Feedback */}
                      <div className="space-y-1 bg-white border border-slate-200 p-4 rounded-xl">
                        <h5 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Evaluation & Advice</h5>
                        <p className="text-slate-600 leading-relaxed text-xs font-medium">{answer.feedback}</p>
                      </div>

                      {/* Score Metrics & Specific Gap */}
                      <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keywords Match</span>
                            <p className="text-base font-black text-emerald-600 mt-0.5">{answer.matchingScore}%</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Question Score</span>
                            <p className="text-base font-black text-indigo-600 mt-0.5">{answer.score}/100</p>
                          </div>
                        </div>

                        {answer.gapAnalysis && (
                          <div className="border-t border-slate-200 pt-2">
                            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">Identified Gap</span>
                            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{answer.gapAnalysis}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}

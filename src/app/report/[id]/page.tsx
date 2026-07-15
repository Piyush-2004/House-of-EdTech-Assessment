import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { 
  Award, 
  ArrowLeft, 
  CheckCircle, 
  HelpCircle, 
  AlertTriangle, 
  BookOpen, 
  Check, 
  Plus,
  ChevronRight
} from "lucide-react";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  // Fetch the completed session details, questions, and scored answers
  const session = await prisma.session.findUnique({
    where: { id },
    include: {
      jd: true,
      questions: {
        orderBy: {
          createdAt: "asc",
        },
      },
      scoredAnswers: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!session) {
    redirect("/dashboard");
  }

  // Guard: Verify ownership or admin/interviewer privileges
  if (
    session.userId !== user.id &&
    user.role !== "admin" &&
    user.role !== "interviewer"
  ) {
    redirect("/dashboard");
  }

  const formattedDate = new Date(session.createdAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Score styling color heuristics
  const scoreColor = 
    session.score >= 80 ? "text-emerald-400 border-emerald-500/20" :
    session.score >= 60 ? "text-amber-400 border-amber-500/20" :
    "text-rose-400 border-rose-500/20";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <span className="text-xs text-slate-500">
          Interviewed on {formattedDate}
        </span>
      </div>

      {/* Main Fit Score Panel */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        {/* Score Radial Circle Simulation */}
        <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-white/5">
          <div className="relative w-36 h-36 flex items-center justify-center rounded-full bg-slate-950 border-[6px] border-slate-900 shadow-inner">
            {/* Ambient inner glow */}
            <div className="absolute inset-0 rounded-full bg-indigo-500/5 blur-sm" />
            <div className="flex flex-col items-center">
              <span className={`text-4xl font-black ${scoreColor.split(" ")[0]}`}>
                {session.score}%
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fit Match</span>
            </div>
            
            {/* SVG circle track */}
            <svg className="absolute inset-[-6px] w-[156px] h-[156px] transform -rotate-90">
              <circle
                cx="78"
                cy="78"
                r="72"
                fill="transparent"
                stroke="rgba(255,255,255,0.02)"
                strokeWidth="6"
              />
              <circle
                cx="78"
                cy="78"
                r="72"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={2 * Math.PI * 72}
                strokeDashoffset={2 * Math.PI * 72 * (1 - session.score / 100)}
                className={scoreColor.split(" ")[0]}
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="mt-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Match Level</span>
            <p className="text-sm font-bold text-white mt-0.5">
              {session.score >= 80 ? "Strong Candidate Fit" :
               session.score >= 60 ? "Moderate Requirements Fit" :
               "Major Skill Gaps Detected"}
            </p>
          </div>
        </div>

        {/* Feedback Summary */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-base text-white">Recruiter's Overall Feedback</h3>
          </div>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            {session.feedbackSummary || "The interview evaluation report is being compiled. Focus on reinforcing structured engineering concepts and clarifying database indexing guidelines during mock tests."}
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
            <span>Role: <strong className="text-white">{session.jd.title}</strong></span>
            <span className="text-slate-700">|</span>
            <span>Target: <strong className="text-white">{session.jd.company}</strong></span>
          </div>
        </div>
      </div>

      {/* Gap Analysis & Study Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Core Skills Gap List */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-rose-400 border-b border-white/5 pb-3">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Identified Gaps</h3>
          </div>
          
          <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
            {session.gapAnalysis ? (
              <div 
                className="prose prose-invert max-w-none text-slate-300 text-sm whitespace-pre-line"
              >
                {session.gapAnalysis}
              </div>
            ) : (
              <p className="text-slate-400">No major gaps identified. Re-run with harder questions for advanced evaluation.</p>
            )}
          </div>
        </div>

        {/* Actionable Recommendations */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 border-b border-white/5 pb-3">
            <BookOpen className="w-5 h-5" />
            <h3 className="font-bold text-sm uppercase tracking-wider text-slate-200">Study Roadmap & Actions</h3>
          </div>
          
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                1
              </div>
              <p>
                <strong>Study Missing Keywords:</strong> Review the expected terminology list on items where you scored below 70% (expand question nodes below).
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                2
              </div>
              <p>
                <strong>Refine Technical Explanations:</strong> Emphasize architectural trade-offs, scaling limits, and security headers during practice.
              </p>
            </li>
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                3
              </div>
              <p>
                <strong>Resume Retake:</strong> Start another session with the same JD to trace improvement and confirm you've bridged these gaps.
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* Question-by-Question Evaluation Breakdown */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <span>Question-by-Question Breakdown</span>
        </h3>

        <div className="space-y-4">
          {session.questions.map((question: any, idx: number) => {
            // Find the matching scored answer
            const answer = session.scoredAnswers.find(
              (sa: any) => sa.questionId === question.id
            );

            const qScoreColor = answer 
              ? answer.score >= 80 ? "text-emerald-400" :
                answer.score >= 60 ? "text-amber-400" :
                "text-rose-400"
              : "text-slate-500";

            return (
              <details
                key={question.id}
                className="group glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300"
              >
                <summary className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] list-none select-none">
                  <div className="flex items-center gap-4 flex-1 pr-4">
                    <span className="text-xs font-bold text-slate-500 w-6">
                      Q{idx + 1}
                    </span>
                    <span className="font-bold text-sm md:text-base text-white text-left line-clamp-1 flex-1">
                      {question.questionText}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`text-sm font-black ${qScoreColor}`}>
                      {answer ? `${answer.score}/100` : "Skipped"}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-open:rotate-90 transition-transform duration-200" />
                  </div>
                </summary>

                {/* Details Accordion Content */}
                <div className="px-5 pb-6 border-t border-white/5 bg-slate-950/20 space-y-5 pt-4 text-sm animate-fade-in">
                  
                  {/* Detailed Question text */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Interviewer Question</h5>
                    <p className="text-white font-medium">{question.questionText}</p>
                  </div>

                  {/* Expected Keywords */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Expected Terminology / Concepts</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {question.expectedKeywords.split(",").map((kw: string, kIdx: number) => (
                        <span 
                          key={kIdx} 
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                        >
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Candidate Answer */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Your Answer</h5>
                    <div className="p-4 rounded-xl bg-slate-900 border border-white/5 text-slate-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                      {answer ? answer.answerText : <span className="text-slate-500 italic">No answer submitted.</span>}
                    </div>
                  </div>

                  {/* AI Evaluation */}
                  {answer && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Detailed Feedback */}
                      <div className="space-y-1 bg-white/[0.01] border border-white/5 p-4 rounded-xl">
                        <h5 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Evaluation & Advice</h5>
                        <p className="text-slate-300 leading-relaxed text-xs">{answer.feedback}</p>
                      </div>

                      {/* Score Metrics & Specific Gap */}
                      <div className="space-y-3 bg-white/[0.01] border border-white/5 p-4 rounded-xl flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Keywords Match</span>
                            <p className="text-base font-black text-emerald-400 mt-0.5">{answer.matchingScore}%</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Question Score</span>
                            <p className="text-base font-black text-indigo-400 mt-0.5">{answer.score}/100</p>
                          </div>
                        </div>

                        {answer.gapAnalysis && (
                          <div className="border-t border-white/5 pt-2">
                            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Identified Gap</span>
                            <p className="text-xs text-slate-300 mt-0.5">{answer.gapAnalysis}</p>
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

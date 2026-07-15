"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  ArrowRight, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Award,
  ChevronRight,
  MessageSquareText,
  Lock
} from "lucide-react";

interface InterviewClientProps {
  session: any;
}

export default function InterviewClient({ session }: InterviewClientProps) {
  const router = useRouter();

  const { id: sessionId, questions, scoredAnswers, jd } = session;

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  
  // Scored answers state
  const [completedAnswers, setCompletedAnswers] = useState<any[]>(scoredAnswers);
  const [currentFeedback, setCurrentFeedback] = useState<any | null>(null);

  // Determine starting question index based on previous submissions
  useEffect(() => {
    if (scoredAnswers.length > 0 && scoredAnswers.length < questions.length) {
      setCurrentQuestionIdx(scoredAnswers.length);
    }
  }, [scoredAnswers, questions]);

  const currentQuestion = questions[currentQuestionIdx];
  const isLastQuestion = currentQuestionIdx === questions.length - 1;
  const progressPercent = Math.round((completedAnswers.length / questions.length) * 100);

  // Word count helper
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;

  // Handle Answer Submission
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) return;

    setError("");
    setLoading(true);
    setCurrentFeedback(null);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/submit-answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answerText: currentAnswer,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit answer.");
      }

      // Add to completed list
      const updatedAnswers = [...completedAnswers, data.scoredAnswer];
      setCompletedAnswers(updatedAnswers);
      setCurrentFeedback(data.scoredAnswer);
      setCurrentAnswer("");
    } catch (err: any) {
      setError(err.message || "Something went wrong while grading your answer.");
    } finally {
      setLoading(false);
    }
  };

  // Advance to next question
  const handleNextQuestion = () => {
    setCurrentFeedback(null);
    if (!isLastQuestion) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  // Complete Interview and Generate Gap Report
  const handleGenerateReport = async () => {
    setError("");
    setCompleting(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete interview.");
      }

      router.push(`/report/${sessionId}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to generate report.");
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      
      {/* Session Progress Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Mock Interview</span>
          <h2 className="text-xl font-bold text-white leading-tight mt-0.5">
            {jd.title} at {jd.company}
          </h2>
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col md:items-end gap-1.5 min-w-[200px]">
          <div className="flex justify-between w-full text-xs font-semibold">
            <span className="text-slate-400">Questions Answered</span>
            <span className="text-white">{completedAnswers.length} / {questions.length}</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question & Answer Interface */}
      {!completing ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Question Display Panel */}
          <div className="glass-panel p-6 md:p-8 rounded-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full capitalize">
                Question {currentQuestionIdx + 1} of {questions.length}
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                currentQuestion.difficulty === "hard" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                currentQuestion.difficulty === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {currentQuestion.difficulty}
              </span>
            </div>

            <div className="flex gap-4 items-start pt-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border border-indigo-400/25 text-white flex-shrink-0 font-bold shadow-md shadow-indigo-500/10">
                AI
              </div>
              <div className="space-y-3">
                <p className="text-lg font-bold text-white leading-relaxed">
                  {currentQuestion.questionText}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <MessageSquareText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Topic: {currentQuestion.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Display (renders right after answer submission) */}
          {currentFeedback && (
            <div className="glass-panel p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/25 animate-fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3">
                <h4 className="font-bold text-sm text-indigo-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Immediate AI Recruiter Feedback</span>
                </h4>
                
                <div className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">Score: </span>
                  <span className="text-sm font-black text-emerald-400">{currentFeedback.score}/100</span>
                </div>
              </div>

              <div className="text-sm text-slate-300 space-y-3 leading-relaxed">
                <p>{currentFeedback.feedback}</p>
                {currentFeedback.gapAnalysis && (
                  <p className="text-xs text-rose-400 font-medium">
                    <span className="font-bold text-slate-300">Target Gap: </span>
                    {currentFeedback.gapAnalysis}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                {!isLastQuestion ? (
                  <button
                    onClick={handleNextQuestion}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all active:scale-95 shadow-md shadow-indigo-600/10"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleGenerateReport}
                    className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-xs font-bold text-white transition-all active:scale-95 shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Skills Gap Report</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* User Input Panel (hidden when feedback is shown) */}
          {!currentFeedback && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Your Answer
                </label>
                <textarea
                  disabled={loading}
                  rows={6}
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl glass-input text-sm leading-relaxed"
                  placeholder="Type your response here. For the best score, be specific, describe your methodologies, and structure your answer..."
                />
              </div>

              {/* Controls Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className={`text-xs font-medium ${
                  wordCount < 20 ? "text-amber-400" : "text-slate-400"
                }`}>
                  {wordCount} words {wordCount < 20 && "(Try to expand your answer for depth)"}
                </span>

                <button
                  onClick={handleSubmitAnswer}
                  disabled={loading || !currentAnswer.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] transition-all shadow-lg shadow-indigo-600/15"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                      <span>Grading Response...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Answer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Report Generation loading overlay */
        <div className="glass-panel p-16 rounded-2xl text-center space-y-6 animate-pulse-glow max-w-lg mx-auto">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
            <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: "3s" }} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Compiling Interview Data</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Gemini is evaluating your profile, aggregate responses, and matching keywords against the JD to generate a comprehensive gap report. Please wait...
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-950 rounded-full overflow-hidden mx-auto border border-white/5">
            <div className="h-full bg-indigo-500 animate-[loadingBar_2s_infinite]" style={{ width: "30%" }} />
          </div>
          <style jsx>{`
            @keyframes loadingBar {
              0% { transform: translateX(-100%); width: 30%; }
              50% { width: 60%; }
              100% { transform: translateX(400%); width: 30%; }
            }
          `}</style>
        </div>
      )}

      {/* Error telemetry alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-200">Submission Blocked</p>
            <p className="text-xs">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

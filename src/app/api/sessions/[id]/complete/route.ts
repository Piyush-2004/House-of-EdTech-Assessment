import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSessionReport } from "@/lib/gemini";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { jd: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    if (session.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden access." }, { status: 403 });
    }

    // 1. Fetch all scored answers for this session
    const scoredAnswers = await prisma.scoredAnswer.findMany({
      where: { sessionId },
    });

    // Extract fields for AI summary
    const answersList = scoredAnswers.map((a) => ({
      questionText: a.questionText,
      answerText: a.answerText,
      score: a.score,
      feedback: a.feedback,
    }));

    // 2. Generate overall feedback and gap report via Gemini
    const report = await generateSessionReport(
      answersList,
      session.jd.textContent,
      session.resumeText
    );

    // 3. Finalize the session in database
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        score: report.overallScore,
        feedbackSummary: report.feedbackSummary,
        gapAnalysis: report.gapAnalysis,
      },
    });

    return NextResponse.json({
      message: "Session finalized and report generated.",
      session: updatedSession,
    });
  } catch (error: any) {
    console.error("Session completion failure:", error);
    return NextResponse.json(
      { error: "Failed to finalize session report. Please retry." },
      { status: 500 }
    );
  }
}

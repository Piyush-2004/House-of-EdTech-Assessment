import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { scoreAnswer } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limiter";

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

    const body = await request.json();
    const { questionId, answerText } = body;

    if (!questionId || answerText === undefined) {
      return NextResponse.json(
        { error: "Missing questionId or answerText." },
        { status: 400 }
      );
    }

    // 1. Fetch Session and Question details to verify
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

    const question = await prisma.questionBank.findUnique({
      where: { id: questionId },
    });

    if (!question || question.sessionId !== sessionId) {
      return NextResponse.json(
        { error: "Question not found or does not belong to this session." },
        { status: 404 }
      );
    }

    // 2. Check DB-backed Rate Limit (Max 30 evaluations/hour)
    const rateCheck = await checkRateLimit(user.id, "gemini_call", 30, 1);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. You can submit another answer in ${rateCheck.resetInMinutes} minute(s).`,
        },
        { status: 429 }
      );
    }

    // 3. Score the answer via Gemini API (or fallback)
    const scoreResult = await scoreAnswer(
      question.questionText,
      answerText,
      session.jd.textContent,
      question.expectedKeywords
    );

    // 4. Create or Update ScoredAnswer record
    const existingAnswer = await prisma.scoredAnswer.findFirst({
      where: {
        sessionId,
        questionId,
      },
    });

    let scoredAnswerRecord;
    if (existingAnswer) {
      scoredAnswerRecord = await prisma.scoredAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          answerText,
          score: scoreResult.score,
          feedback: scoreResult.feedback,
          matchingScore: scoreResult.matchingScore,
          gapAnalysis: scoreResult.gapAnalysis,
        },
      });
    } else {
      scoredAnswerRecord = await prisma.scoredAnswer.create({
        data: {
          sessionId,
          questionId,
          questionText: question.questionText,
          answerText,
          score: scoreResult.score,
          feedback: scoreResult.feedback,
          matchingScore: scoreResult.matchingScore,
          gapAnalysis: scoreResult.gapAnalysis,
        },
      });
    }

    return NextResponse.json({
      message: "Answer evaluated successfully.",
      scoredAnswer: scoredAnswerRecord,
    });
  } catch (error: any) {
    console.error("Answer submission failure:", error);
    return NextResponse.json(
      { error: "Failed to score answer. Please try again." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { analyzeJdAndGenerateQuestions } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, company, jdText, resumeText, questionCount = 5 } = body;

    if (!title || !company || !jdText || !resumeText) {
      return NextResponse.json(
        { error: "Missing required fields: title, company, jdText, and resumeText are required." },
        { status: 400 }
      );
    }

    // 1. Analyze JD + Resume & Generate Questions (Hits JdCache if matched)
    const analysis = await analyzeJdAndGenerateQuestions(jdText, resumeText, questionCount);

    // 2. Create JobDescription in database
    const jd = await prisma.jobDescription.create({
      data: {
        title: analysis.title || title,
        company: analysis.company || company,
        textContent: jdText,
      },
    });

    // 3. Create Session in database
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        jdId: jd.id,
        resumeText,
        status: "in_progress",
        score: 0.0,
      },
    });

    // 4. Create QuestionBank records for the session
    const questionData = analysis.questions.map((q) => ({
      sessionId: session.id,
      questionText: q.questionText,
      expectedKeywords: q.expectedKeywords,
      difficulty: q.difficulty,
      category: q.category,
    }));

    await prisma.questionBank.createMany({
      data: questionData,
    });

    return NextResponse.json(
      {
        message: "Interview session created successfully.",
        sessionId: session.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to start session:", error);
    return NextResponse.json(
      { error: "Failed to generate questions or setup session. Please verify inputs." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      include: {
        jd: {
          select: {
            title: true,
            company: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

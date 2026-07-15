import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Admin or Interviewer only
    if (user.role !== "admin" && user.role !== "interviewer") {
      return NextResponse.json({ error: "Forbidden access." }, { status: 403 });
    }

    // Fetch all mock sessions with candidate name and JD details
    const sessions = await prisma.session.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        jd: {
          select: {
            title: true,
            company: true,
          },
        },
        scoredAnswers: {
          select: {
            id: true,
          },
        },
        questions: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Compute aggregated metrics for the admin landing panel
    const completedSessions = sessions.filter((s) => s.status === "completed");
    const totalCount = sessions.length;
    const completedCount = completedSessions.length;
    
    const avgScore = completedCount
      ? Math.round(completedSessions.reduce((acc, s) => acc + s.score, 0) / completedCount)
      : 0;

    // Score distribution categories
    const highFit = completedSessions.filter((s) => s.score >= 80).length;
    const moderateFit = completedSessions.filter((s) => s.score >= 60 && s.score < 80).length;
    const lowFit = completedCount - highFit - moderateFit;

    return NextResponse.json({
      sessions,
      metrics: {
        totalCount,
        completedCount,
        inProgressCount: totalCount - completedCount,
        avgScore,
        distribution: {
          highFit,
          moderateFit,
          lowFit,
        },
      },
    });
  } catch (error) {
    console.error("Admin dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

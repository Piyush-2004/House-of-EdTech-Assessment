import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json({ error: "Session not found." }, { status: 404 });
    }

    // Verify authorization: owning candidate or admin/interviewer
    if (
      session.userId !== user.id &&
      user.role !== "admin" &&
      user.role !== "interviewer"
    ) {
      return NextResponse.json({ error: "Forbidden access." }, { status: 403 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to fetch session details:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

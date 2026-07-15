import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import ReportClient from "@/components/ReportClient";

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

  return <ReportClient session={session} formattedDate={formattedDate} />;
}

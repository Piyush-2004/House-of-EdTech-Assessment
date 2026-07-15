import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import InterviewClient from "./InterviewClient";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  // Fetch the active session with questions and previously submitted answers
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

  // Guard: Verify ownership
  if (session.userId !== user.id) {
    redirect("/dashboard");
  }

  // Redirect if already completed
  if (session.status === "completed") {
    redirect(`/report/${session.id}`);
  }

  return <InterviewClient session={session} />;
}

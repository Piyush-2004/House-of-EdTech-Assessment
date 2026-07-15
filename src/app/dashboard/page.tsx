import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getSession();
  
  // Double guard (though middleware already does this)
  if (!user) {
    redirect("/login");
  }

  // Fetch candidate's sessions and job descriptions
  const sessions = await prisma.session.findMany({
    where: { userId: user.id },
    include: {
      jd: true,
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

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
            Hi, <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{user.name}</span>
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm md:text-base">
            Track your performance, review skill gaps, and practice mock interviews tailored to your target jobs.
          </p>
        </div>
      </div>

      {/* Render Interactive Client Panel */}
      <DashboardClient initialSessions={sessions} user={user} />
    </div>
  );
}

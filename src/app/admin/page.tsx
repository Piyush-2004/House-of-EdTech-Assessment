import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await getSession();

  // Guard: Authenticated and authorized as admin/interviewer
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin" && user.role !== "interviewer") {
    redirect("/dashboard");
  }

  // Fetch all mock sessions across the application
  const sessions = await prisma.session.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
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
      {/* Admin Title Banner */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
          Recruiter & <span className="bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">Admin Dashboard</span>
        </h1>
        <p className="text-slate-400 mt-1.5 text-sm md:text-base">
          Monitor candidate mock interview history, review score outputs, and evaluate skills gaps.
        </p>
      </div>

      <AdminClient initialSessions={sessions} user={user} />
    </div>
  );
}

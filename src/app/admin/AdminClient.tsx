"use client";

import { useState } from "react";
import Link from "next/link";
import { UserSession } from "@/lib/auth";
import { 
  Search, 
  Users, 
  Award, 
  Calendar, 
  FileText, 
  Filter,
  CheckCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface AdminClientProps {
  initialSessions: any[];
  user: UserSession;
}

export default function AdminClient({ initialSessions, user }: AdminClientProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Filtered Sessions
  const filteredSessions = sessions.filter((session) => {
    const candidateName = session.user.name.toLowerCase();
    const candidateEmail = session.user.email.toLowerCase();
    const title = session.jd.title.toLowerCase();
    const company = session.jd.company.toLowerCase();
    const query = searchTerm.toLowerCase();

    const matchesSearch = 
      candidateName.includes(query) ||
      candidateEmail.includes(query) ||
      title.includes(query) ||
      company.includes(query);

    const matchesStatus = 
      filterStatus === "all" ||
      (filterStatus === "completed" && session.status === "completed") ||
      (filterStatus === "in_progress" && session.status === "in_progress");

    return matchesSearch && matchesStatus;
  });

  // Telemetry aggregates
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalCount = sessions.length;
  const completedCount = completedSessions.length;
  
  const averageScore = completedCount
    ? Math.round(completedSessions.reduce((acc, s) => acc + s.score, 0) / completedCount)
    : 0;

  const highFitCount = completedSessions.filter((s) => s.score >= 80).length;
  const moderateFitCount = completedSessions.filter((s) => s.score >= 60 && s.score < 80).length;

  return (
    <div className="space-y-6">
      
      {/* Telemetry Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Candidates */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Tests</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{totalCount}</span>
            <p className="text-[11px] text-slate-500 mt-1">{completedCount} completed / {totalCount - completedCount} active</p>
          </div>
        </div>

        {/* Avg Performance */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Fit Match</span>
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-slate-800">{averageScore}%</span>
            <p className="text-[11px] text-slate-500 mt-1">Across all completed mocks</p>
          </div>
        </div>

        {/* High Match Count */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Fit (≥80%)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-emerald-600">{highFitCount}</span>
            <p className="text-[11px] text-slate-500 mt-1">Strong candidates matching JDs</p>
          </div>
        </div>

        {/* Moderate Match Count */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moderate Fit (60-79%)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold text-amber-600">{moderateFitCount}</span>
            <p className="text-[11px] text-slate-500 mt-1">Candidates requiring minor upskilling</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl glass-input text-xs"
            placeholder="Search candidate name, email, company or role title..."
          />
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-44 px-3 py-2.5 rounded-xl glass-input text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed Only</option>
            <option value="in_progress">In Progress Only</option>
          </select>
        </div>
      </div>

      {/* Candidates Session Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold">
                <th className="p-4 pl-6 text-slate-500 uppercase tracking-wider text-[10px]">Candidate</th>
                <th className="p-4 text-slate-500 uppercase tracking-wider text-[10px]">Target Role & Company</th>
                <th className="p-4 text-slate-500 uppercase tracking-wider text-[10px]">Date Taken</th>
                <th className="p-4 text-slate-500 uppercase tracking-wider text-[10px]">Status</th>
                <th className="p-4 text-slate-500 uppercase tracking-wider text-[10px]">Score</th>
                <th className="p-4 pr-6 text-right text-slate-500 uppercase tracking-wider text-[10px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                    No mock sessions found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => {
                  const formattedDate = new Date(session.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Candidate */}
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs md:text-sm">{session.user.name || "Anonymous Candidate"}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">{session.user.email}</span>
                        </div>
                      </td>

                      {/* Job Info */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800 text-xs md:text-sm">{session.jd.title}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5">{session.jd.company}</span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {session.status === "completed" ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            <Clock className="w-2.5 h-2.5" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="p-4">
                        {session.status === "completed" ? (
                          <span className="font-black text-sm text-emerald-600">{session.score}%</span>
                        ) : (
                          <span className="text-slate-500 italic text-xs">Pending</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        {session.status === "completed" ? (
                          <Link
                            href={`/report/${session.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-500 hover:underline transition-colors"
                          >
                            <span>Report</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Interviewing...</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

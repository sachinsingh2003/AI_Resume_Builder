/** Dashboard home — quick stats + shortcuts to modules. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Scan, MessageSquare, Kanban, ArrowUpRight, Compass, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import PageHeader from "@/components/layout/PageHeader";
import api from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const SHORTCUTS = [
  { to: "/dashboard/resumes", icon: FileText, label: "Build resume" },
  { to: "/dashboard/ats", icon: Scan, label: "Check ATS" },
  { to: "/dashboard/interview", icon: MessageSquare, label: "Interview prep" },
  { to: "/dashboard/cover-letter", icon: Mail, label: "Cover letter" },
  { to: "/dashboard/career", icon: Compass, label: "Career advisor" },
  { to: "/dashboard/jobs", icon: Kanban, label: "Track jobs" },
];

export default function DashboardHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/dashboard/summary").then(r => setStats(r.data)).catch(() => setStats({}));
  }, []);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] || "there"}.`}
        subtitle="One dashboard for every artifact in your job hunt."
        testId="dashboard-title"
      />
      <div className="px-8 py-10 max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { k: "resume_count", label: "Resumes", icon: FileText },
            { k: "ats_count", label: "ATS scans", icon: Scan },
            { k: "interview_count", label: "Interview sets", icon: MessageSquare },
            { k: "job_count", label: "Jobs tracked", icon: Kanban },
          ].map((c) => (
            <div key={c.k} data-testid={`stat-${c.k}`} className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
              <div className="flex items-center justify-between text-zinc-500 text-xs uppercase tracking-widest">
                {c.label} <c.icon className="w-4 h-4" />
              </div>
              <div className="mt-4 font-display text-4xl font-black">
                {stats == null ? <Skeleton className="h-10 w-16 bg-white/5" /> : (stats[c.k] ?? 0)}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Jump into</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SHORTCUTS.map((s) => (
              <Link key={s.to} to={s.to} data-testid={`shortcut-${s.label.replace(/\s+/g, "-").toLowerCase()}`}
                className="group p-6 rounded-lg border border-white/8 bg-white/[0.02] hover:border-white/20 hover-lift transition-fast flex items-center gap-4">
                <div className="w-10 h-10 rounded border border-white/10 bg-white/5 flex items-center justify-center">
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 font-display text-lg font-bold">{s.label}</div>
                <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-fast" />
              </Link>
            ))}
          </div>
        </div>

        {stats?.avg_ats_score > 0 && (
          <div className="mt-10 p-8 rounded-lg border border-white/8 bg-white/[0.02]">
            <div className="text-xs uppercase tracking-widest text-zinc-500">Recent momentum</div>
            <div className="mt-2 font-display text-3xl font-black">Median ATS score {stats.avg_ats_score}/100</div>
            <p className="mt-2 text-sm text-zinc-500">Based on your last 5 scans. Aim for 85+ to consistently clear filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

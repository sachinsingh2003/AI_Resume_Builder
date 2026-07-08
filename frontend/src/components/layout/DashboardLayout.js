/** Dashboard layout — sticky sidebar + outlet. */
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, Scan, MessageSquare, Mail, Compass, Kanban, User, Settings, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/dashboard/resumes", icon: FileText, label: "Resumes" },
  { to: "/dashboard/ats", icon: Scan, label: "ATS Checker" },
  { to: "/dashboard/interview", icon: MessageSquare, label: "Interview" },
  { to: "/dashboard/cover-letter", icon: Mail, label: "Cover Letter" },
  { to: "/dashboard/career", icon: Compass, label: "Career Advisor" },
  { to: "/dashboard/jobs", icon: Kanban, label: "Job Tracker" },
  { to: "/dashboard/profile", icon: User, label: "Profile" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const doLogout = async () => { await logout(); nav("/"); };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex">
      <aside className="w-64 shrink-0 border-r border-white/5 bg-[#08090b] sticky top-0 h-screen flex flex-col" data-testid="dashboard-sidebar">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
            <span className="font-display font-bold text-lg tracking-tighter">CareerForge</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={`nav-${n.label.toLowerCase().replace(/ /g, "-")}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded text-sm transition-fast ${isActive ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5 hover:text-white"}`}>
              <n.icon className="w-4 h-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
          <div className="mb-3 text-xs text-zinc-500">
            <div className="text-zinc-300 truncate" data-testid="sidebar-user-name">{user?.name || user?.email}</div>
            <div className="truncate">{user?.email}</div>
          </div>
          <Button variant="ghost" onClick={doLogout} data-testid="logout-btn" className="w-full justify-start text-zinc-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

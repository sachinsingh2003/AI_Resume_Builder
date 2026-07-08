/** Resumes list — create/delete + open editor. */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, FileText } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import api, { formatApiError } from "@/lib/api";

export default function Resumes() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const load = () => api.get("/resumes").then(r => setItems(r.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      const { data } = await api.post("/resumes", {
        title: "Untitled resume",
        template: "modern",
        data: { fullName: "", email: "", phone: "", location: "", headline: "", summary: "", experiences: [], education: [], skills: [], projects: [] },
      });
      nav(`/dashboard/resumes/${data.id}`);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
  };

  const del = async (id) => {
    if (!confirm("Delete this resume?")) return;
    try { await api.delete(`/resumes/${id}`); load(); toast.success("Resume deleted"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
  };

  return (
    <div>
      <PageHeader title="Resumes" subtitle="Multiple resumes, all versioned. Autosave on."
        right={<Button data-testid="new-resume-btn" onClick={create} className="rounded-full bg-white text-black hover:bg-zinc-200"><Plus className="w-4 h-4 mr-2" /> New resume</Button>}
      />
      <div className="px-8 py-10 max-w-6xl">
        {loading ? (
          <div className="text-zinc-500 text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 rounded-lg border border-dashed border-white/10 text-center">
            <FileText className="w-8 h-8 mx-auto text-zinc-500" />
            <div className="mt-4 font-display text-xl">No resumes yet</div>
            <p className="mt-2 text-sm text-zinc-500">Create your first resume in seconds.</p>
            <Button onClick={create} data-testid="empty-create-btn" className="mt-6 rounded-full bg-white text-black hover:bg-zinc-200">
              <Plus className="w-4 h-4 mr-2" /> New resume
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((r) => (
              <div key={r.id} data-testid={`resume-card-${r.id}`} className="p-6 rounded-lg border border-white/8 bg-white/[0.02] hover-lift transition-fast">
                <div className="flex items-start justify-between">
                  <Link to={`/dashboard/resumes/${r.id}`} className="font-display text-lg font-bold hover:underline">{r.title || "Untitled"}</Link>
                  <button data-testid={`delete-resume-${r.id}`} onClick={() => del(r.id)} className="text-zinc-500 hover:text-red-400 transition-fast"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="mt-4 text-xs text-zinc-500 uppercase tracking-widest">{r.template}</div>
                <div className="mt-1 text-xs text-zinc-600">Updated {new Date(r.updated_at).toLocaleString()}</div>
                <Link to={`/dashboard/resumes/${r.id}`} className="mt-6 block text-sm text-blue-400 hover:underline">Open editor →</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

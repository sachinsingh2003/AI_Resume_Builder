/** Job Tracker — kanban across pipeline stages. */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, Kanban } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api, { formatApiError } from "@/lib/api";

const STAGES = ["Applied", "OA", "Interview", "HR", "Offer", "Rejected", "Joined"];
const emptyForm = () => ({ company: "", role: "", status: "Applied", location: "", salary: "", notes: "", link: "" });

export default function JobTracker() {
  const [jobs, setJobs] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await api.get("/jobs");
      setJobs(r.data);
    } catch (e) {
      console.warn("Failed to load jobs:", e?.message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.company || !form.role) { toast.error("Company and role required"); return; }
    try {
      if (editing) await api.put(`/jobs/${editing}`, form);
      else await api.post("/jobs", form);
      setOpen(false); setEditing(null); setForm(emptyForm()); load();
      toast.success(editing ? "Updated" : "Job added");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
  };

  const del = async (id) => {
    if (!confirm("Delete this job?")) return;
    try { await api.delete(`/jobs/${id}`); load(); } catch (e) { toast.error(e.message); }
  };

  const move = async (job, status) => {
    try { await api.put(`/jobs/${job.id}`, { ...job, status }); load(); }
    catch (e) { toast.error(e.message); }
  };

  const openEdit = (j) => { setForm({ ...j }); setEditing(j.id); setOpen(true); };

  return (
    <div>
      <PageHeader title="Job Tracker" subtitle="Every application. Every stage. One board."
        right={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); setForm(emptyForm()); } }}>
            <DialogTrigger asChild>
              <Button data-testid="add-job-btn" className="rounded-full bg-white text-black hover:bg-zinc-200"><Plus className="w-4 h-4 mr-2" />Add job</Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0e0f11] border-white/10">
              <DialogHeader><DialogTitle className="font-display">{editing ? "Edit job" : "Add job"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Company</Label><Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} data-testid="job-company" className="mt-2 bg-white/5 border-white/10" /></div>
                  <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} data-testid="job-role" className="mt-2 bg-white/5 border-white/10" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger data-testid="job-status" className="mt-2 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-2 bg-white/5 border-white/10" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Salary</Label><Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="mt-2 bg-white/5 border-white/10" /></div>
                  <div><Label>Link</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="mt-2 bg-white/5 border-white/10" /></div>
                </div>
                <div><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-2 bg-white/5 border-white/10" /></div>
              </div>
              <DialogFooter>
                <Button onClick={submit} data-testid="job-save-btn" className="rounded-full bg-white text-black hover:bg-zinc-200">{editing ? "Update" : "Add"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-8 overflow-x-auto">
        <div className="min-w-max grid grid-cols-7 gap-3">
          {STAGES.map((stage) => {
            const list = jobs.filter((j) => j.status === stage);
            return (
              <div key={stage} className="w-64" data-testid={`stage-${stage}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase tracking-widest text-zinc-500">{stage}</div>
                  <span className="text-xs text-zinc-500">{list.length}</span>
                </div>
                <div className="space-y-2 min-h-32">
                  {list.map((j) => (
                    <div key={j.id} data-testid={`job-${j.id}`} className="p-3 rounded border border-white/8 bg-white/[0.02] hover-lift transition-fast">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">{j.role}</div>
                          <div className="text-xs text-zinc-500 truncate">{j.company}</div>
                        </div>
                        <button onClick={() => del(j.id)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                      {j.link && <a href={j.link} target="_blank" rel="noreferrer" className="mt-2 text-xs text-blue-400 hover:underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />Link</a>}
                      <div className="mt-3 flex flex-wrap gap-1">
                        <button onClick={() => openEdit(j)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <Select value={j.status} onValueChange={(v) => move(j, v)}>
                          <SelectTrigger className="h-6 text-xs bg-white/5 border-white/10 ml-auto w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {jobs.length === 0 && (
          <div className="mt-10 p-12 rounded-lg border border-dashed border-white/10 text-center">
            <Kanban className="w-8 h-8 mx-auto text-zinc-500" />
            <div className="mt-4 font-display text-xl">No jobs yet</div>
            <p className="mt-2 text-sm text-zinc-500">Add your first application to start tracking.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/** AI Career Advisor. */
import { useState } from "react";
import { toast } from "sonner";
import { Compass } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import api, { formatApiError } from "@/lib/api";

export default function CareerAdvisor() {
  const [form, setForm] = useState({
    current_role: "", target_role: "", skills: "", years_experience: 0, education: "", location: "",
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const upd = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const advise = async () => {
    setBusy(true); setResult(null);
    try {
      const payload = { ...form, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean), years_experience: Number(form.years_experience) || 0 };
      const { data } = await api.post("/career/advice", payload);
      setResult(data);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="AI Career Advisor" subtitle="Roadmap, skill gaps, salary bands, target companies." />
      <div className="px-8 py-10 max-w-6xl grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div><Label>Current role</Label><Input value={form.current_role} onChange={(e) => upd("current_role", e.target.value)} data-testid="ca-current" className="mt-2 bg-white/5 border-white/10" /></div>
          <div><Label>Target role</Label><Input value={form.target_role} onChange={(e) => upd("target_role", e.target.value)} data-testid="ca-target" className="mt-2 bg-white/5 border-white/10" /></div>
          <div><Label>Skills (comma-separated)</Label><Input value={form.skills} onChange={(e) => upd("skills", e.target.value)} data-testid="ca-skills" className="mt-2 bg-white/5 border-white/10" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Years of experience</Label><Input type="number" value={form.years_experience} onChange={(e) => upd("years_experience", e.target.value)} data-testid="ca-years" className="mt-2 bg-white/5 border-white/10" /></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => upd("location", e.target.value)} data-testid="ca-location" className="mt-2 bg-white/5 border-white/10" /></div>
          </div>
          <div><Label>Education</Label><Textarea rows={2} value={form.education} onChange={(e) => upd("education", e.target.value)} data-testid="ca-education" className="mt-2 bg-white/5 border-white/10" /></div>
          <Button onClick={advise} disabled={busy} data-testid="ca-advise-btn" className="rounded-full bg-white text-black hover:bg-zinc-200">
            <Compass className="w-4 h-4 mr-2" /> {busy ? "Analyzing…" : "Build my roadmap"}
          </Button>
        </div>
        <div>
          {!result && !busy && (
            <div className="p-12 rounded-lg border border-dashed border-white/10 text-center h-full flex flex-col items-center justify-center">
              <Compass className="w-8 h-8 text-zinc-500" />
              <div className="mt-4 font-display text-xl">Your plan appears here</div>
            </div>
          )}
          {busy && <div className="p-12 text-center text-zinc-500">Thinking…</div>}
          {result && (
            <div className="space-y-4" data-testid="ca-result">
              {result.current_role_snapshot && (
                <Card title="Snapshot"><p className="text-sm text-zinc-300">{result.current_role_snapshot}</p></Card>
              )}
              {result.target_roles?.length > 0 && (
                <Card title="Target roles"><div className="flex flex-wrap gap-2">{result.target_roles.map((r) => <Badge key={r} className="bg-blue-500/10 border-blue-500/30 text-blue-200">{r}</Badge>)}</div></Card>
              )}
              {result.roadmap?.length > 0 && (
                <Card title="Roadmap">
                  <div className="space-y-4">
                    {result.roadmap.map((s, i) => (
                      <div key={`stage-${s.stage || i}`}>
                        <div className="font-mono-alt text-xs text-zinc-500">{s.stage}</div>
                        <ul className="list-disc ml-5 text-sm text-zinc-300 mt-1">{(s.actions || []).map((a) => <li key={a}>{a}</li>)}</ul>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {result.skill_gaps?.length > 0 && (
                <Card title="Skill gaps"><div className="flex flex-wrap gap-2">{result.skill_gaps.map((s) => <Badge key={s} variant="outline" className="border-yellow-500/30 text-yellow-200">{s}</Badge>)}</div></Card>
              )}
              {result.recommended_certifications?.length > 0 && (
                <Card title="Certifications"><ul className="list-disc ml-5 text-sm">{result.recommended_certifications.map((c) => <li key={c}>{c}</li>)}</ul></Card>
              )}
              {result.learning_resources?.length > 0 && (
                <Card title="Learning">
                  <ul className="text-sm space-y-2">
                    {result.learning_resources.map((r) => (<li key={`${r.title}-${r.url_or_source}`}><b>{r.title}</b> <span className="text-zinc-500">— {r.url_or_source}</span></li>))}
                  </ul>
                </Card>
              )}
              {result.salary_estimate_usd && (
                <Card title="Salary estimate (USD)">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    {Object.entries(result.salary_estimate_usd).map(([k, v]) => (
                      <div key={k} className="p-3 rounded border border-white/8 bg-white/[0.02]">
                        <div className="text-xs uppercase tracking-widest text-zinc-500">{k}</div>
                        <div className="font-mono-alt mt-1">{v}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {result.suitable_companies?.length > 0 && (
                <Card title="Suitable companies"><div className="flex flex-wrap gap-2">{result.suitable_companies.map((c) => <Badge key={c} className="bg-white/5 border-white/10 text-zinc-200">{c}</Badge>)}</div></Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
      <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">{title}</div>
      {children}
    </div>
  );
}

/** Resume editor with live preview + autosave + PDF export (print).
 * The preview area (id="resume-print") is targeted by @media print in
 * index.css so window.print produces a clean PDF. */
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Trash2, Download, Sparkles, Save } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import api, { formatApiError } from "@/lib/api";

const emptyExp = () => ({ id: crypto.randomUUID(), role: "", company: "", start: "", end: "", bullets: "" });
const emptyEdu = () => ({ id: crypto.randomUUID(), school: "", degree: "", start: "", end: "" });
const emptyProj = () => ({ id: crypto.randomUUID(), name: "", description: "", link: "" });

const TEMPLATES = ["modern", "classic", "compact"];

export default function ResumeEditor() {
  const { id } = useParams();
  const [title, setTitle] = useState("Untitled resume");
  const [template, setTemplate] = useState("modern");
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);
  const skipFirst = useRef(true);

  useEffect(() => {
    api.get(`/resumes/${id}`).then((r) => {
      setTitle(r.data.title || "Untitled");
      setTemplate(r.data.template || "modern");
      setData({
        fullName: "", email: "", phone: "", location: "", headline: "",
        summary: "", experiences: [], education: [], skills: [], projects: [],
        ...(r.data.data || {}),
      });
    }).catch(e => toast.error(formatApiError(e.response?.data?.detail) || e.message));
  }, [id]);

  // autosave
  useEffect(() => {
    if (!data) return;
    if (skipFirst.current) { skipFirst.current = false; return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await api.put(`/resumes/${id}`, { title, template, data });
      } catch (e) { toast.error("Autosave failed"); }
      finally { setSaving(false); }
    }, 800);
    return () => clearTimeout(timerRef.current);
  }, [title, template, data, id]);

  const upd = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const updList = (k, idx, patch) =>
    setData((d) => ({ ...d, [k]: d[k].map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));

  const improve = async () => {
    if (!data) return;
    const resumeText = JSON.stringify(data);
    toast.promise(
      api.post("/resumes/improve", { resume_text: resumeText, target_role: data.headline }).then((r) => {
        if (r.data.rewritten_summary) upd("summary", r.data.rewritten_summary);
        return r.data;
      }),
      { loading: "AI is analyzing…", success: "Suggestions applied", error: "AI improvement failed" }
    );
  };

  if (!data) return <div className="p-8 text-zinc-500">Loading…</div>;

  return (
    <div>
      <PageHeader
        title={
          <Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="resume-title-input"
            className="!text-4xl !font-black bg-transparent border-0 shadow-none px-0 !h-auto tracking-tighter font-display" />
        }
        subtitle={saving ? "Saving…" : "Autosave on."}
        right={
          <div className="flex gap-2 no-print">
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-36 bg-white/5 border-white/10" data-testid="template-select"><SelectValue /></SelectTrigger>
              <SelectContent>{TEMPLATES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={improve} data-testid="ai-improve-btn" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"><Sparkles className="w-4 h-4 mr-2" />AI Improve</Button>
            <Button variant="outline" onClick={() => window.print()} data-testid="export-pdf-btn" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10"><Download className="w-4 h-4 mr-2" />PDF</Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
        {/* Editor */}
        <div className="space-y-6 no-print">
          <Section title="Basics">
            <Grid2>
              <Field label="Full name" value={data.fullName} onChange={(v) => upd("fullName", v)} testId="basics-fullname" />
              <Field label="Headline" value={data.headline} onChange={(v) => upd("headline", v)} testId="basics-headline" />
              <Field label="Email" value={data.email} onChange={(v) => upd("email", v)} testId="basics-email" />
              <Field label="Phone" value={data.phone} onChange={(v) => upd("phone", v)} testId="basics-phone" />
              <Field label="Location" value={data.location} onChange={(v) => upd("location", v)} testId="basics-location" />
            </Grid2>
          </Section>
          <Section title="Summary">
            <Textarea rows={4} value={data.summary} onChange={(e) => upd("summary", e.target.value)}
              data-testid="summary-textarea" className="bg-white/5 border-white/10" />
          </Section>
          <Section title="Experience" onAdd={() => upd("experiences", [...data.experiences, emptyExp()])}>
            {data.experiences.map((x, i) => (
              <div key={x.id} className="p-4 rounded border border-white/8 bg-white/[0.02] space-y-3">
                <Grid2>
                  <Field label="Role" value={x.role} onChange={(v) => updList("experiences", i, { role: v })} />
                  <Field label="Company" value={x.company} onChange={(v) => updList("experiences", i, { company: v })} />
                  <Field label="Start" value={x.start} onChange={(v) => updList("experiences", i, { start: v })} />
                  <Field label="End" value={x.end} onChange={(v) => updList("experiences", i, { end: v })} />
                </Grid2>
                <Textarea placeholder="One bullet per line" rows={4} value={x.bullets}
                  onChange={(e) => updList("experiences", i, { bullets: e.target.value })}
                  className="bg-white/5 border-white/10" />
                <button className="text-xs text-red-400 hover:underline" onClick={() => upd("experiences", data.experiences.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3 inline mr-1" /> Remove</button>
              </div>
            ))}
          </Section>
          <Section title="Education" onAdd={() => upd("education", [...data.education, emptyEdu()])}>
            {data.education.map((x, i) => (
              <div key={x.id} className="p-4 rounded border border-white/8 bg-white/[0.02] space-y-3">
                <Grid2>
                  <Field label="School" value={x.school} onChange={(v) => updList("education", i, { school: v })} />
                  <Field label="Degree" value={x.degree} onChange={(v) => updList("education", i, { degree: v })} />
                  <Field label="Start" value={x.start} onChange={(v) => updList("education", i, { start: v })} />
                  <Field label="End" value={x.end} onChange={(v) => updList("education", i, { end: v })} />
                </Grid2>
                <button className="text-xs text-red-400 hover:underline" onClick={() => upd("education", data.education.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3 inline mr-1" /> Remove</button>
              </div>
            ))}
          </Section>
          <Section title="Skills">
            <Textarea rows={2} placeholder="Comma-separated" value={(data.skills || []).join(", ")}
              onChange={(e) => upd("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
              className="bg-white/5 border-white/10" data-testid="skills-input" />
          </Section>
          <Section title="Projects" onAdd={() => upd("projects", [...(data.projects || []), emptyProj()])}>
            {(data.projects || []).map((x, i) => (
              <div key={x.id} className="p-4 rounded border border-white/8 bg-white/[0.02] space-y-3">
                <Grid2>
                  <Field label="Name" value={x.name} onChange={(v) => updList("projects", i, { name: v })} />
                  <Field label="Link" value={x.link} onChange={(v) => updList("projects", i, { link: v })} />
                </Grid2>
                <Textarea rows={2} value={x.description} onChange={(e) => updList("projects", i, { description: e.target.value })} className="bg-white/5 border-white/10" />
                <button className="text-xs text-red-400 hover:underline" onClick={() => upd("projects", data.projects.filter((_, j) => j !== i))}><Trash2 className="w-3 h-3 inline mr-1" /> Remove</button>
              </div>
            ))}
          </Section>
        </div>

        {/* Preview */}
        <div id="resume-print" className="bg-white text-zinc-900 rounded-lg p-10 shadow-2xl min-h-[900px] font-serif">
          <ResumePreview data={data} template={template} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, onAdd }) {
  return (
    <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs uppercase tracking-widest text-zinc-500">{title}</div>
        {onAdd && <Button size="sm" variant="ghost" onClick={onAdd} className="text-zinc-400 hover:text-white h-7"><Plus className="w-3 h-3 mr-1" /> Add</Button>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
function Grid2({ children }) { return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>; }
function Field({ label, value, onChange, testId }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} data-testid={testId}
        className="mt-1 bg-white/5 border-white/10" />
    </div>
  );
}

function ResumePreview({ data, template }) {
  const compact = template === "compact";
  const classic = template === "classic";
  return (
    <div className={compact ? "text-sm" : ""}>
      <header className={classic ? "text-center border-b border-zinc-300 pb-4" : "pb-4 border-b border-zinc-300"}>
        <div className={`font-bold ${classic ? "text-3xl" : "text-4xl"}`}>{data.fullName || "Your Name"}</div>
        {data.headline && <div className="text-zinc-600 mt-1">{data.headline}</div>}
        <div className="mt-2 text-xs text-zinc-600 flex flex-wrap gap-2 justify-start">
          {data.email && <span>{data.email}</span>}
          {data.phone && <span>· {data.phone}</span>}
          {data.location && <span>· {data.location}</span>}
        </div>
      </header>
      {data.summary && <section className="mt-6"><h3 className="font-bold uppercase text-sm tracking-widest">Summary</h3><p className="mt-2 leading-relaxed">{data.summary}</p></section>}
      {(data.experiences || []).length > 0 && (
        <section className="mt-6"><h3 className="font-bold uppercase text-sm tracking-widest">Experience</h3>
          {data.experiences.map((x) => (
            <div key={x.id} className="mt-3">
              <div className="flex justify-between"><span className="font-semibold">{x.role} · {x.company}</span><span className="text-xs text-zinc-600">{x.start} – {x.end}</span></div>
              <ul className="list-disc ml-5 mt-1 text-sm leading-relaxed">
                {(x.bullets || "").split("\n").filter(Boolean).map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
      {(data.education || []).length > 0 && (
        <section className="mt-6"><h3 className="font-bold uppercase text-sm tracking-widest">Education</h3>
          {data.education.map((x) => (
            <div key={x.id} className="mt-2 flex justify-between"><span><b>{x.degree}</b> · {x.school}</span><span className="text-xs text-zinc-600">{x.start} – {x.end}</span></div>
          ))}
        </section>
      )}
      {(data.skills || []).length > 0 && (
        <section className="mt-6"><h3 className="font-bold uppercase text-sm tracking-widest">Skills</h3>
          <p className="mt-2 text-sm">{data.skills.join(" · ")}</p>
        </section>
      )}
      {(data.projects || []).length > 0 && (
        <section className="mt-6"><h3 className="font-bold uppercase text-sm tracking-widest">Projects</h3>
          {data.projects.map((p) => (
            <div key={p.id} className="mt-2">
              <div className="font-semibold">{p.name} {p.link && <span className="text-xs text-zinc-600 font-normal">— {p.link}</span>}</div>
              <div className="text-sm">{p.description}</div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

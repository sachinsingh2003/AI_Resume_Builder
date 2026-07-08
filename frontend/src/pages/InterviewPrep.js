/** Interview Preparation — generate role-tailored questions across categories.
 * Persists sessions per user (visible under history). */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { MessageSquare, ChevronDown } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import api, { formatApiError } from "@/lib/api";

const CATEGORIES = ["HR", "Technical", "Behavioral", "Coding"];
const EXP = ["intern", "junior", "mid", "senior", "staff"];

export default function InterviewPrep() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("mid");
  const [category, setCategory] = useState("HR");
  const [resumeText, setResumeText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const r = await api.get("/interview/history");
      setHistory(r.data);
    } catch (e) {
      console.warn("Failed to load interview history:", e?.message);
    }
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const generate = async () => {
    if (!role.trim()) { toast.error("Enter a target role"); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/interview/generate", { role, experience, category, resume_text: resumeText });
      setResult(data);
      loadHistory();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
    finally { setBusy(false); }
  };

  const openHistory = async (id) => {
    try {
      const { data } = await api.get(`/interview/${id}`);
      setResult(data.result);
      setRole(data.role); setCategory(data.category); setExperience(data.experience);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
  };

  return (
    <div>
      <PageHeader title="Interview Preparation" subtitle="Question sets that mirror the actual loop. Save every session." />
      <div className="px-8 py-10 max-w-6xl grid lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div>
            <Label>Target role</Label>
            <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Senior React Engineer"
              data-testid="interview-role-input" className="mt-2 bg-white/5 border-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Experience</Label>
              <Select value={experience} onValueChange={setExperience}>
                <SelectTrigger data-testid="interview-experience-select" className="mt-2 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{EXP.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="interview-category-select" className="mt-2 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Resume context (optional)</Label>
            <Textarea rows={6} value={resumeText} onChange={(e) => setResumeText(e.target.value)}
              data-testid="interview-resume-input" className="mt-2 bg-white/5 border-white/10" />
          </div>
          <Button onClick={generate} disabled={busy} data-testid="interview-generate-btn"
            className="w-full rounded-full bg-white text-black hover:bg-zinc-200">
            <MessageSquare className="w-4 h-4 mr-2" /> {busy ? "Generating…" : "Generate 8 questions"}
          </Button>

          {history.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Session history</div>
              <div className="space-y-2 max-h-64 overflow-auto pr-2">
                {history.map((h) => (
                  <button key={h.id} data-testid={`interview-history-${h.id}`} onClick={() => openHistory(h.id)}
                    className="w-full text-left p-3 rounded border border-white/8 bg-white/[0.02] hover:bg-white/[0.05] transition-fast text-sm">
                    <div className="font-medium">{h.role}</div>
                    <div className="text-xs text-zinc-500">{h.category} · {h.question_count} Qs · {new Date(h.created_at).toLocaleDateString()}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          {!result && !busy && (
            <div className="p-12 rounded-lg border border-dashed border-white/10 text-center h-full flex flex-col items-center justify-center">
              <MessageSquare className="w-8 h-8 text-zinc-500" />
              <div className="mt-4 font-display text-xl">No session yet</div>
              <p className="mt-2 text-sm text-zinc-500">Fill the form and generate your first set.</p>
            </div>
          )}
          {busy && <div className="p-12 text-center text-zinc-500">Generating…</div>}
          {result?.questions && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-blue-500/10 border-blue-500/30 text-blue-200">{category}</Badge>
                <span className="text-sm text-zinc-400">{role} · {experience}</span>
              </div>
              <Accordion type="multiple" data-testid="interview-questions">
                {result.questions.map((q, i) => (
                  <AccordionItem key={q.question || `q-${i}`} value={`q-${i}`} className="border-white/8">
                    <AccordionTrigger data-testid={`q-trigger-${i}`} className="hover:no-underline text-left">
                      <span className="flex gap-3">
                        <span className="font-mono-alt text-zinc-500">{String(i + 1).padStart(2, "0")}</span>
                        <span className="font-medium">{q.question}</span>
                        <Badge variant="outline" className="ml-2 border-white/10 text-zinc-400">{q.difficulty}</Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-400 leading-relaxed">
                      <div className="p-4 rounded border border-white/8 bg-white/[0.02]">
                        <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Sample answer</div>
                        <p className="text-sm text-zinc-300">{q.sample_answer}</p>
                        {q.evaluation_criteria?.length > 0 && (
                          <div className="mt-4">
                            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Evaluation criteria</div>
                            <ul className="list-disc ml-5 text-sm">{q.evaluation_criteria.map((c) => (<li key={c}>{c}</li>))}</ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

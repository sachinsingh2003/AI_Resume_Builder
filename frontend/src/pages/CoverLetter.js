/** Cover Letter Generator. */
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Copy } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import api, { formatApiError } from "@/lib/api";

export default function CoverLetter() {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const gen = async () => {
    if (!company || !role || !resumeText || !jd) { toast.error("All fields required"); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/cover-letter/generate", { company, role, resume_text: resumeText, job_description: jd });
      setResult(data);
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
    finally { setBusy(false); }
  };

  const copy = () => {
    if (!result?.cover_letter) return;
    navigator.clipboard.writeText(result.cover_letter);
    toast.success("Copied");
  };

  return (
    <div>
      <PageHeader title="Cover Letter Generator" subtitle="Tailored, specific, in your voice." />
      <div className="px-8 py-10 max-w-6xl grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} data-testid="cl-company" className="mt-2 bg-white/5 border-white/10" /></div>
            <div><Label>Role</Label><Input value={role} onChange={(e) => setRole(e.target.value)} data-testid="cl-role" className="mt-2 bg-white/5 border-white/10" /></div>
          </div>
          <div><Label>Resume text</Label><Textarea rows={8} value={resumeText} onChange={(e) => setResumeText(e.target.value)} data-testid="cl-resume" className="mt-2 bg-white/5 border-white/10" /></div>
          <div><Label>Job description</Label><Textarea rows={6} value={jd} onChange={(e) => setJd(e.target.value)} data-testid="cl-jd" className="mt-2 bg-white/5 border-white/10" /></div>
          <Button onClick={gen} disabled={busy} data-testid="cl-generate-btn" className="rounded-full bg-white text-black hover:bg-zinc-200">
            <Mail className="w-4 h-4 mr-2" /> {busy ? "Writing…" : "Generate cover letter"}
          </Button>
        </div>
        <div>
          {!result && !busy && (
            <div className="p-12 rounded-lg border border-dashed border-white/10 text-center h-full flex flex-col items-center justify-center">
              <Mail className="w-8 h-8 text-zinc-500" />
              <div className="mt-4 font-display text-xl">Your letter appears here</div>
            </div>
          )}
          {busy && <div className="p-12 text-center text-zinc-500">Writing…</div>}
          {result?.cover_letter && (
            <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]" data-testid="cl-result">
              <div className="flex justify-between items-start mb-4">
                <div className="text-xs uppercase tracking-widest text-zinc-500">Cover letter</div>
                <Button variant="ghost" size="sm" onClick={copy} data-testid="cl-copy-btn" className="text-zinc-400 hover:text-white"><Copy className="w-4 h-4 mr-1" /> Copy</Button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm text-zinc-200 leading-relaxed">{result.cover_letter}</pre>
              {result.key_matches?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Key matches</div>
                  <ul className="list-disc ml-5 text-sm text-zinc-400">{result.key_matches.map((k) => <li key={k}>{k}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

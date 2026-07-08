/** ATS Checker — paste resume + optional JD, get score + suggestions. */
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Scan, CheckCircle2, AlertTriangle, Upload } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import api, { formatApiError } from "@/lib/api";

export default function ATSChecker() {
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);

  const loadHistory = useCallback(async () => {
    try {
      const r = await api.get("/ats/history");
      setHistory(r.data);
    } catch (e) {
      console.warn("Failed to load ATS history:", e?.message);
    }
  }, []);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const analyze = async () => {
    if (!resumeText.trim()) { toast.error("Paste your resume text first"); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/ats/analyze", { resume_text: resumeText, job_description: jd });
      setResult(data);
      loadHistory();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
    finally { setBusy(false); }
  };

  const upload = async (file) => {
    setBusy(true); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("job_description", jd);
      const { data } = await api.post("/ats/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(data);
      loadHistory();
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="ATS Resume Checker" subtitle="Score your resume against the machine before the human sees it." />
      <div className="px-8 py-10 max-w-6xl grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <Label>Resume text</Label>
            <Textarea rows={12} value={resumeText} onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume here…" data-testid="ats-resume-input"
              className="mt-2 bg-white/5 border-white/10 font-mono-alt text-xs" />
          </div>
          <div>
            <Label>Job description (optional)</Label>
            <Textarea rows={6} value={jd} onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the target JD for keyword matching…" data-testid="ats-jd-input"
              className="mt-2 bg-white/5 border-white/10" />
          </div>
          <div className="flex gap-2">
            <Button onClick={analyze} disabled={busy} data-testid="ats-analyze-btn" className="rounded-full bg-white text-black hover:bg-zinc-200">
              <Scan className="w-4 h-4 mr-2" /> {busy ? "Analyzing…" : "Analyze"}
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".txt,.md,.pdf" className="hidden" data-testid="ats-upload-input"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              <span className="inline-flex items-center h-10 px-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm transition-fast">
                <Upload className="w-4 h-4 mr-2" /> Upload file
              </span>
            </label>
          </div>

          {history.length > 0 && (
            <div className="mt-8">
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Recent scans</div>
              <div className="space-y-2 max-h-64 overflow-auto pr-2">
                {history.map((h) => (
                  <div key={h.id} data-testid={`ats-history-${h.id}`} className="flex items-center justify-between p-3 rounded border border-white/8 bg-white/[0.02] text-sm">
                    <div>Score <b>{h.score}</b> · {h.filename || "pasted"}</div>
                    <div className="text-xs text-zinc-500">{new Date(h.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {!result && !busy && (
            <div className="p-12 rounded-lg border border-dashed border-white/10 text-center h-full flex flex-col items-center justify-center">
              <Scan className="w-8 h-8 text-zinc-500" />
              <div className="mt-4 font-display text-xl">Awaiting analysis</div>
              <p className="mt-2 text-sm text-zinc-500">Your ATS score and keyword breakdown will appear here.</p>
            </div>
          )}
          {busy && <div className="p-12 text-center text-zinc-500">Analyzing…</div>}
          {result && (
            <div className="space-y-4" data-testid="ats-result">
              <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
                <div className="flex items-baseline gap-3">
                  <div className="font-display text-6xl font-black" data-testid="ats-score">{result.score ?? 0}</div>
                  <div className="text-zinc-500">/ 100</div>
                </div>
                <Progress value={result.score || 0} className="mt-4 bg-white/5" />
                <p className="mt-4 text-sm text-zinc-400">{result.summary}</p>
              </div>
              {result.missing_keywords?.length > 0 && (
                <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Missing keywords</div>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_keywords.map((k) => (
                      <Badge key={k} variant="outline" className="border-yellow-500/30 text-yellow-200 bg-yellow-500/5">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {result.matched_keywords?.length > 0 && (
                <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Matched</div>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_keywords.map((k) => (<Badge key={k} className="bg-green-500/10 text-green-300 border-green-500/30">{k}</Badge>))}
                  </div>
                </div>
              )}
              {result.improvement_suggestions?.length > 0 && (
                <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
                  <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Suggestions</div>
                  <ul className="space-y-2 text-sm text-zinc-300">
                    {result.improvement_suggestions.map((s) => (<li key={s} className="flex gap-2"><CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" /> {s}</li>))}
                  </ul>
                </div>
              )}
              {result.formatting_issues?.length > 0 && (
                <div className="p-6 rounded-lg border border-orange-500/20 bg-orange-500/5">
                  <div className="text-xs uppercase tracking-widest text-orange-300 mb-3">Formatting issues</div>
                  <ul className="space-y-2 text-sm text-orange-100">
                    {result.formatting_issues.map((s) => (<li key={s} className="flex gap-2"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {s}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

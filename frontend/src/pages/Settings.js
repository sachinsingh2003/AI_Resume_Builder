/** Settings — change password. */
import { useState } from "react";
import { toast } from "sonner";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { formatApiError } from "@/lib/api";

export default function Settings() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const change = async () => {
    if (next.length < 6) { toast.error("New password must be 6+ chars"); return; }
    setBusy(true);
    try {
      await api.post("/profile/change-password", { current_password: cur, new_password: next });
      toast.success("Password updated");
      setCur(""); setNext("");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Account, security, preferences." />
      <div className="px-8 py-10 max-w-xl space-y-6">
        <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Change password</div>
          <div className="space-y-3">
            <div><Label>Current password</Label><Input type="password" value={cur} onChange={(e) => setCur(e.target.value)} data-testid="settings-current-pw" className="mt-2 bg-white/5 border-white/10" /></div>
            <div><Label>New password</Label><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} data-testid="settings-new-pw" className="mt-2 bg-white/5 border-white/10" /></div>
            <Button onClick={change} disabled={busy} data-testid="settings-change-pw-btn" className="rounded-full bg-white text-black hover:bg-zinc-200">{busy ? "Updating…" : "Update password"}</Button>
          </div>
        </div>
        <div className="p-6 rounded-lg border border-white/8 bg-white/[0.02]">
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Subscription</div>
          <p className="text-sm text-zinc-400">You're on the <b className="text-white">Free</b> plan. Upgrade coming soon (Razorpay integration).</p>
        </div>
      </div>
    </div>
  );
}

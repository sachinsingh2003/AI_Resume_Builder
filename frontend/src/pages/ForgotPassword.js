/** Forgot password — request reset token. Backend returns `reset_token_dev`
 * for dev testing (email sending mocked). */
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { formatApiError } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [devToken, setDevToken] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      toast.success("If that email exists, a reset link is sent.");
      if (data.reset_token_dev) setDevToken(data.reset_token_dev);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-zinc-100 p-6">
      <form onSubmit={submit} data-testid="forgot-form" className="w-full max-w-md">
        <h1 className="font-display text-4xl font-black tracking-tighter">Reset password</h1>
        <p className="mt-2 text-sm text-zinc-500">We'll send you a reset link.</p>
        <div className="mt-8 space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" data-testid="forgot-email-input" type="email" required
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-2 bg-white/5 border-white/10" />
          </div>
          <Button type="submit" disabled={busy} data-testid="forgot-submit-btn"
            className="w-full rounded-full h-11 bg-white text-black hover:bg-zinc-200 transition-fast">
            {busy ? "Sending…" : "Send reset link"}
          </Button>
        </div>
        {devToken && (
          <div className="mt-6 p-4 rounded border border-white/10 bg-white/5 text-xs">
            <div className="text-zinc-400 mb-2">Dev token (email is mocked):</div>
            <Link to={`/reset-password?token=${devToken}`} className="text-blue-400 break-all hover:underline" data-testid="dev-reset-link">
              /reset-password?token={devToken}
            </Link>
          </div>
        )}
        <p className="mt-8 text-sm text-zinc-500">
          <Link to="/login" className="text-white hover:underline">Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}

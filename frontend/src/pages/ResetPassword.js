/** Reset password using token from query string. */
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api, { formatApiError } from "@/lib/api";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const token = sp.get("token") || "";

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password updated. Please sign in.");
      nav("/login");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] text-zinc-100 p-6">
      <form onSubmit={submit} data-testid="reset-form" className="w-full max-w-md">
        <h1 className="font-display text-4xl font-black tracking-tighter">New password</h1>
        <p className="mt-2 text-sm text-zinc-500">Choose something you'll remember.</p>
        <div className="mt-8 space-y-5">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" data-testid="reset-password-input" type="password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-2 bg-white/5 border-white/10" />
          </div>
          <Button type="submit" disabled={busy || !token} data-testid="reset-submit-btn"
            className="w-full rounded-full h-11 bg-white text-black hover:bg-zinc-200 transition-fast">
            {busy ? "Updating…" : "Update password"}
          </Button>
          {!token && <p className="text-xs text-red-400">Missing token in URL.</p>}
        </div>
        <p className="mt-8 text-sm text-zinc-500">
          <Link to="/login" className="text-white hover:underline">Back to sign in</Link>
        </p>
      </form>
    </div>
  );
}

/** Login page. */
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Sparkles } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const loc = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await login(email, password);
    setBusy(false);
    if (r.ok) {
      toast.success("Welcome back");
      nav(loc.state?.from?.pathname || "/dashboard");
    } else toast.error(r.error);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#050505] text-zinc-100">
      <div className="hidden md:flex flex-col justify-between p-12 border-r border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
          <span className="font-display font-bold text-lg tracking-tighter">CareerForge</span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-4xl font-black tracking-tighter max-w-md leading-tight">
            "Two weeks later — offer. Unfair advantage."
          </h2>
          <p className="mt-4 text-sm text-zinc-500">— Priya M., SWE at a Series-B startup</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <form onSubmit={submit} className="w-full max-w-md" data-testid="login-form">
          <div className="md:hidden mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center"><Sparkles className="w-4 h-4" /></div>
              <span className="font-display font-bold text-lg tracking-tighter">CareerForge</span>
            </Link>
          </div>
          <h1 className="font-display text-4xl font-black tracking-tighter">Sign in</h1>
          <p className="mt-2 text-sm text-zinc-500">Welcome back. Ship your next application.</p>
          <div className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" data-testid="login-email-input" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-white/5 border-white/10" />
            </div>
            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" data-testid="forgot-link" className="text-xs text-zinc-500 hover:text-white transition-fast">Forgot?</Link>
              </div>
              <Input id="password" data-testid="login-password-input" type="password" required
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-white/5 border-white/10" />
            </div>
            <Button type="submit" disabled={busy} data-testid="login-submit-btn"
              className="w-full rounded-full h-11 bg-white text-black hover:bg-zinc-200 transition-fast">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </div>
          <p className="mt-8 text-sm text-zinc-500">
            New here? <Link to="/register" data-testid="signup-link" className="text-white hover:underline">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

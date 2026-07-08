/** Register page. */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Sparkles } from "lucide-react";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be 6+ chars"); return; }
    setBusy(true);
    const r = await register(email, password, name);
    setBusy(false);
    if (r.ok) { toast.success("Account created"); nav("/dashboard"); }
    else toast.error(r.error);
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
            Start with intent. Ship in minutes.
          </h2>
          <ul className="mt-6 space-y-3 text-sm text-zinc-400">
            <li>— Resume that clears ATS</li>
            <li>— Interview reps that mirror the loop</li>
            <li>— Roadmap grounded in your data</li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <form onSubmit={submit} className="w-full max-w-md" data-testid="register-form">
          <h1 className="font-display text-4xl font-black tracking-tighter">Create account</h1>
          <p className="mt-2 text-sm text-zinc-500">Free forever. No credit card.</p>
          <div className="mt-8 space-y-5">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" data-testid="register-name-input" required
                value={name} onChange={(e) => setName(e.target.value)}
                className="mt-2 bg-white/5 border-white/10" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" data-testid="register-email-input" type="email" required
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-white/5 border-white/10" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" data-testid="register-password-input" type="password" required minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-white/5 border-white/10" />
            </div>
            <Button type="submit" disabled={busy} data-testid="register-submit-btn"
              className="w-full rounded-full h-11 bg-white text-black hover:bg-zinc-200 transition-fast">
              {busy ? "Creating…" : "Create account"}
            </Button>
          </div>
          <p className="mt-8 text-sm text-zinc-500">
            Already have one? <Link to="/login" data-testid="login-link" className="text-white hover:underline">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

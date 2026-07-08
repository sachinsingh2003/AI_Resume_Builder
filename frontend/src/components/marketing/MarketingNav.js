/** Top-level marketing navbar for public pages (Landing, Terms, etc.). */
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function MarketingNav() {
  const nav = useNavigate();
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5">
      <div className="glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" data-testid="brand-logo" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-tighter">CareerForge</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
            <a href="/#features" className="hover:text-white transition-fast">Features</a>
            <a href="/#pricing" className="hover:text-white transition-fast">Pricing</a>
            <a href="/#faq" className="hover:text-white transition-fast">FAQ</a>
            <Link to="/contact" className="hover:text-white transition-fast">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" data-testid="nav-login-btn" onClick={() => nav("/login")}
              className="text-zinc-300 hover:text-white">Sign in</Button>
            <Button data-testid="nav-signup-btn" onClick={() => nav("/register")}
              className="rounded-full bg-white text-black hover:bg-zinc-200 transition-fast">
              Get started
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

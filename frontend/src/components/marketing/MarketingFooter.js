/** Site-wide footer for marketing pages. */
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-white/5 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded bg-white text-black flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-tighter">CareerForge</span>
          </div>
          <p className="text-sm text-zinc-500 leading-relaxed">
            AI-native career operating system. Resumes, interviews, career paths — one deliberate workspace.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Product</div>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><a href="/#features" className="hover:text-white transition-fast">Features</a></li>
            <li><a href="/#pricing" className="hover:text-white transition-fast">Pricing</a></li>
            <li><a href="/#faq" className="hover:text-white transition-fast">FAQ</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Company</div>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><Link to="/contact" className="hover:text-white transition-fast">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-white transition-fast">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-white transition-fast">Terms</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Get Started</div>
          <ul className="space-y-3 text-sm text-zinc-400">
            <li><Link to="/register" className="hover:text-white transition-fast">Create account</Link></li>
            <li><Link to="/login" className="hover:text-white transition-fast">Sign in</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} CareerForge. Built with intent.
      </div>
    </footer>
  );
}

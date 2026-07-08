/** Landing page — Hero, Features, Bento, Pricing, Testimonials, FAQ, CTA. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, FileText, Scan, MessageSquare, Compass, Kanban, Sparkles, Check } from "lucide-react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";

const FEATURES = [
  { icon: FileText, title: "Resume Builder", desc: "Multiple templates, live preview, drag-and-drop, PDF export with autosave.", tag: "01" },
  { icon: Scan, title: "ATS Checker", desc: "Score your resume against target roles. Get missing keywords, formatting fixes.", tag: "02" },
  { icon: MessageSquare, title: "Interview Prep", desc: "Tailored HR, Technical, Behavioral & Coding questions with sample answers.", tag: "03" },
  { icon: Compass, title: "Career Advisor", desc: "Roadmaps, skill-gaps, salary ranges and target companies mapped to your profile.", tag: "04" },
  { icon: FileText, title: "Cover Letters", desc: "Job-tailored letters written in your voice from your resume + JD.", tag: "05" },
  { icon: Kanban, title: "Job Tracker", desc: "Kanban across Applied → Offer with notes, links and reminders.", tag: "06" },
];

const TIERS = [
  { name: "Free", monthly: 0, yearly: 0, blurb: "For getting started.",
    perks: ["1 resume", "3 ATS scans / month", "Basic interview sets", "Job tracker"], cta: "Start free" },
  { name: "Pro", monthly: 19, yearly: 190, blurb: "For active job seekers.",
    perks: ["Unlimited resumes", "Unlimited ATS scans", "All interview categories", "Career advisor", "Priority AI"], cta: "Start Pro", featured: true },
  { name: "Team", monthly: 49, yearly: 490, blurb: "For coaches & bootcamps.",
    perks: ["Everything in Pro", "5 user seats", "Shared templates", "Analytics", "SSO & audit log"], cta: "Contact sales" },
];

const TESTIMONIALS = [
  { name: "Priya Menon", role: "SWE @ Series-B startup",
    body: "The ATS checker caught keyword gaps my recruiter friends missed. Two weeks later — offer.",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwzfHxwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdCUyMHdvcmtpbmclMjBsYXB0b3B8ZW58MHx8fHwxNzgzNTE5OTU3fDA&ixlib=rb-4.1.0&q=85" },
  { name: "Marcus Reed", role: "PM, EU fintech",
    body: "Cover letters that don't sound generic and interview prep that mirrors the actual loop. Unfair advantage.",
    img: "https://images.unsplash.com/photo-1698047682091-782b1e5c6536?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwxfHxvZmZpY2UlMjBpbnRlcnZpZXclMjBtZWV0aW5nfGVufDB8fHx8MTc4MzUxOTk1N3ww&ixlib=rb-4.1.0&q=85" },
];

const FAQS = [
  { q: "Is CareerForge really free to start?", a: "Yes. Free plan gets you 1 resume and 3 ATS scans per month — no credit card." },
  { q: "Which AI powers the tools?", a: "State-of-the-art frontier LLMs (GPT-class) with prompts tuned for hiring workflows." },
  { q: "Do you store my resume data?", a: "Only in your account, encrypted at rest. Delete any resume with one click." },
  { q: "Can I export to PDF and DOCX?", a: "PDF export is available in the resume editor. DOCX is on the roadmap." },
  { q: "Is there a student discount?", a: "Yes — email us with .edu proof for a 50% Pro discount." },
];

export default function Landing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#050505] text-zinc-100">
      <MarketingNav />

      {/* Hero */}
      <section className="relative pt-40 pb-32 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <Badge variant="outline" className="rounded-full border-white/10 bg-white/5 text-zinc-300 mb-8" data-testid="hero-badge">
            <Sparkles className="w-3 h-3 mr-1.5" /> New — AI Career Advisor v2
          </Badge>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.95] max-w-5xl">
            Land the offer.
            <br />
            <span className="text-zinc-500">Not the interview loop.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-lg text-zinc-400 leading-relaxed">
            CareerForge is the AI career workspace for people who take their job hunt seriously. Resumes that pass ATS, interviews you actually rehearse, roadmaps grounded in reality.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/register">
              <Button data-testid="hero-cta-primary" className="rounded-full bg-white text-black hover:bg-zinc-200 h-12 px-8 text-sm font-medium transition-fast">
                Start free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button data-testid="hero-cta-secondary" variant="ghost" className="rounded-full text-zinc-300 hover:text-white h-12 px-6 transition-fast">
                See what's inside
              </Button>
            </a>
          </div>
          <div className="mt-16 grid grid-cols-3 gap-6 max-w-2xl text-sm">
            {[
              { k: "12k+", v: "resumes crafted" },
              { k: "94%", v: "median ATS score" },
              { k: "3.2×", v: "callback rate" },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-display text-3xl font-bold">{s.k}</div>
                <div className="text-zinc-500">{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento features */}
      <section id="features" className="py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 flex items-end justify-between flex-wrap gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Features</div>
              <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tighter max-w-2xl">
                A workspace, not a form.
              </h2>
            </div>
            <p className="text-zinc-500 max-w-md text-sm">Six deliberate tools. No bloat. Every action grounded in your data.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={f.title}
                data-testid={`feature-card-${i}`}
                className={`relative p-8 border border-white/8 rounded-lg bg-white/[0.02] hover-lift transition-fast ${i === 0 ? "md:col-span-2" : ""}`}>
                <div className="flex items-start justify-between mb-8">
                  <div className="w-10 h-10 rounded border border-white/10 flex items-center justify-center bg-white/5">
                    <f.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-mono-alt text-zinc-600">{f.tag}</span>
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Pricing</div>
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tighter">Priced for one goal — your offer.</h2>
            <div className="mt-8 flex items-center justify-center gap-3 text-sm">
              <span className={yearly ? "text-zinc-500" : "text-white"}>Monthly</span>
              <Switch data-testid="pricing-yearly-toggle" checked={yearly} onCheckedChange={setYearly} />
              <span className={yearly ? "text-white" : "text-zinc-500"}>Yearly <span className="text-xs text-blue-400 ml-1">-17%</span></span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {TIERS.map((t, i) => (
              <div key={t.name} data-testid={`pricing-tier-${t.name.toLowerCase()}`}
                className={`relative p-8 rounded-lg border ${t.featured ? "border-white/40 bg-white/[0.04]" : "border-white/8 bg-white/[0.02]"}`}>
                {t.featured && (
                  <div className="absolute -top-3 left-8 text-[10px] tracking-widest uppercase bg-white text-black px-2 py-1 rounded">Popular</div>
                )}
                <div className="text-sm font-medium text-zinc-400">{t.name}</div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-5xl font-black">${yearly ? t.yearly : t.monthly}</span>
                  <span className="text-sm text-zinc-500">/{yearly ? "yr" : "mo"}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{t.blurb}</p>
                <ul className="mt-8 space-y-3 text-sm">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-zinc-300">
                      <Check className="w-4 h-4 mt-0.5 text-blue-400" /> {p}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block mt-8">
                  <Button data-testid={`pricing-cta-${t.name.toLowerCase()}`}
                    className={`w-full rounded-full h-11 transition-fast ${t.featured ? "bg-white text-black hover:bg-zinc-200" : "bg-white/10 text-white hover:bg-white/20"}`}>
                    {t.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">Loved by ambitious operators</div>
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tighter max-w-3xl">
              Real feedback. Real interviews. Real offers.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <figure key={t.name} data-testid={`testimonial-${i}`}
                className="p-8 rounded-lg border border-white/8 bg-white/[0.02] flex gap-6 hover-lift">
                <img src={t.img} alt={t.name} className="w-16 h-16 rounded-full object-cover shrink-0" />
                <div>
                  <blockquote className="text-lg text-zinc-200 leading-relaxed">"{t.body}"</blockquote>
                  <figcaption className="mt-4 text-sm text-zinc-500">
                    <span className="text-zinc-200 font-medium">{t.name}</span> — {t.role}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-32 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-12">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-3">FAQ</div>
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tighter">Questions, cleared.</h2>
          </div>
          <Accordion type="single" collapsible className="w-full" data-testid="faq-accordion">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`item-${i}`} className="border-white/8">
                <AccordionTrigger data-testid={`faq-q-${i}`} className="text-left font-display text-lg hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="font-display text-5xl sm:text-6xl font-black tracking-tighter">
            The next role won't apply for itself.
          </h2>
          <p className="mt-6 text-zinc-400 max-w-xl mx-auto">Ship a serious application in the next 15 minutes.</p>
          <Link to="/register">
            <Button data-testid="footer-cta" className="mt-10 rounded-full bg-white text-black hover:bg-zinc-200 h-12 px-8 transition-fast">
              Start free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

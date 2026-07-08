/** Reusable legal / contact page. */
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import api, { formatApiError } from "@/lib/api";

const TERMS = `Welcome to CareerForge. By using this service, you agree to the following Terms of Service.

1. Accounts. You are responsible for the security of your account and all activity performed under it.

2. Acceptable use. You may not use CareerForge to generate content that is illegal, discriminatory, or infringing. You may not attempt to reverse-engineer, disrupt, or overload the service.

3. AI-generated content. Outputs from AI tools are guidance, not guarantees. Review all content before submitting to employers. CareerForge is not liable for hiring decisions or interview outcomes.

4. Subscriptions. Paid plans renew automatically until cancelled. Refunds follow the region-specific policy at checkout.

5. Termination. We may suspend accounts that violate these terms. You may delete your account at any time from Settings.

6. Changes. We may update these terms with reasonable notice. Continued use constitutes acceptance.`;

const PRIVACY = `Your data belongs to you. This policy describes what we collect, why, and how you can control it.

Data we collect
- Account data (email, name).
- Resumes, cover letters, ATS reports, interview sessions, job applications, career profile.
- Basic usage logs required for security and reliability.

How we use data
- To provide AI features on your behalf.
- To improve service quality (aggregated, anonymized).

Retention and deletion
- Data is retained while your account is active. Delete resumes/reports individually or delete your account to purge all data.

Third parties
- AI providers process content on our behalf under strict data-processing agreements. We do not sell your data.

Rights
- You can export, correct, or delete your data at any time.`;

export default function LegalPage({ kind }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/contact", { name, email, message });
      toast.success("Thanks — we'll get back to you.");
      setName(""); setEmail(""); setMessage("");
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || e.message);
    } finally { setBusy(false); }
  };

  const titles = { terms: "Terms of Service", privacy: "Privacy Policy", contact: "Contact" };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <MarketingNav />
      <section className="pt-40 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <h1 data-testid={`legal-title-${kind}`} className="font-display text-5xl font-black tracking-tighter">{titles[kind]}</h1>
          {kind === "terms" && (
            <div data-testid="terms-content" className="mt-10 text-zinc-400 whitespace-pre-wrap leading-relaxed">{TERMS}</div>
          )}
          {kind === "privacy" && (
            <div data-testid="privacy-content" className="mt-10 text-zinc-400 whitespace-pre-wrap leading-relaxed">{PRIVACY}</div>
          )}
          {kind === "contact" && (
            <form onSubmit={submit} data-testid="contact-form" className="mt-10 space-y-5 max-w-lg">
              <div><Label>Name</Label><Input required value={name} data-testid="contact-name" onChange={(e) => setName(e.target.value)} className="mt-2 bg-white/5 border-white/10" /></div>
              <div><Label>Email</Label><Input type="email" required value={email} data-testid="contact-email" onChange={(e) => setEmail(e.target.value)} className="mt-2 bg-white/5 border-white/10" /></div>
              <div><Label>Message</Label><Textarea rows={6} required value={message} data-testid="contact-message" onChange={(e) => setMessage(e.target.value)} className="mt-2 bg-white/5 border-white/10" /></div>
              <Button disabled={busy} type="submit" data-testid="contact-submit" className="rounded-full bg-white text-black hover:bg-zinc-200 transition-fast">{busy ? "Sending…" : "Send message"}</Button>
            </form>
          )}
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

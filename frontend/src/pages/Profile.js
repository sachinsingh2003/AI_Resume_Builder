/** Profile management. */
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiError } from "@/lib/api";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({ name: "", phone: "", location: "", headline: "", linkedin: "", website: "", bio: "" });
  const [busy, setBusy] = useState(false);

  // Populate the form when the authenticated user is loaded.
  // setForm is stable; the functional updater lets us safely omit `f` from deps.
  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: user.name || "", ...user }));
  }, [user]);

  const save = async () => {
    setBusy(true);
    try { await api.put("/profile", form); await refresh(); toast.success("Profile saved"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail) || e.message); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Used to personalize AI features." />
      <div className="px-8 py-10 max-w-3xl space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Full name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name" className="mt-2 bg-white/5 border-white/10" /></div>
          <div><Label>Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="profile-phone" className="mt-2 bg-white/5 border-white/10" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Location</Label><Input value={form.location || ""} onChange={(e) => setForm({ ...form, location: e.target.value })} data-testid="profile-location" className="mt-2 bg-white/5 border-white/10" /></div>
          <div><Label>Headline</Label><Input value={form.headline || ""} onChange={(e) => setForm({ ...form, headline: e.target.value })} data-testid="profile-headline" className="mt-2 bg-white/5 border-white/10" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>LinkedIn</Label><Input value={form.linkedin || ""} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} className="mt-2 bg-white/5 border-white/10" /></div>
          <div><Label>Website</Label><Input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} className="mt-2 bg-white/5 border-white/10" /></div>
        </div>
        <div><Label>Bio</Label><Textarea rows={4} value={form.bio || ""} onChange={(e) => setForm({ ...form, bio: e.target.value })} data-testid="profile-bio" className="mt-2 bg-white/5 border-white/10" /></div>
        <Button onClick={save} disabled={busy} data-testid="profile-save-btn" className="rounded-full bg-white text-black hover:bg-zinc-200">
          <Save className="w-4 h-4 mr-2" /> {busy ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

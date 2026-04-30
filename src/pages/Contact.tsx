import { useState } from "react";
import { ArrowRight } from "lucide-react";
import contactImage from "@/assets/contact-editorial.jpg";
import { PageTitle } from "@/components/PageTitle";

const channels = [
  { label: "General Enquiries", email: "info@wmgsounds.com" },
  { label: "Press", email: "press@wmgsounds.com" },
  { label: "Licensing / Sync", email: "sync@wmgsounds.com" },
  { label: "Artist & Demo Submissions", email: "demos@wmgsounds.com" },
];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "General", message: "", website: "" });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || sent) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("send_failed");
      setSent(true);
      setForm({ name: "", email: "", subject: "General", message: "", website: "" });
    } catch {
      setErrorMsg("Something went wrong. Please email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-background">
      <PageTitle title="Contact" />
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[43%_57%]">
        <div className="relative min-h-[44vh] overflow-hidden bg-ink lg:min-h-screen">
          <img
            src={contactImage}
            alt="Moody vintage telephone and notebook"
            className="absolute inset-0 h-full w-full object-cover grayscale sepia opacity-75 contrast-125 saturate-50"
            loading="eager"
            width={1024}
            height={1536}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_34%,transparent_0,hsl(var(--ink)/0.10)_30%,hsl(var(--ink)/0.88)_100%)]" aria-hidden="true" />
          <div className="absolute inset-0 bg-gold/10 mix-blend-color" aria-hidden="true" />
          <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        </div>

        <div className="relative overflow-hidden bg-gold/10 px-6 pb-24 pt-28 md:px-12 md:pb-32 md:pt-36 lg:px-16 xl:px-24">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:linear-gradient(90deg,hsl(var(--ink)/0.16)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ink)/0.12)_1px,transparent_1px)] [background-size:4px_4px]" aria-hidden="true" />
          <div className="relative mx-auto max-w-4xl">
            <p className="eyebrow mb-5 text-golden-brown">Contact</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-6">Get in touch.</h1>
            <p className="font-serif text-2xl md:text-3xl leading-tight max-w-2xl mb-14">
              Send us a note. Whether it's press, sync, or new music, we read every message.
            </p>

            <div className="grid grid-cols-1 gap-14 xl:grid-cols-12 xl:gap-16">
              <div className="xl:col-span-5">
                {channels.map((c) => (
                  <div key={c.label} className="border-t border-gold/40 py-5 last:border-b">
                    <p className="eyebrow mb-2 text-golden-brown">{c.label}</p>
                    <a href={`mailto:${c.email}`} className="font-serif text-2xl leading-tight link-underline md:text-3xl">
                      {c.email}
                    </a>
                  </div>
                ))}
              </div>

              {sent ? (
                <div className="xl:col-span-7">
                  <p className="font-serif text-2xl italic text-golden-brown md:text-3xl">
                    Message sent. We'll be in touch.
                  </p>
                </div>
              ) : (
              <form onSubmit={onSubmit} className="xl:col-span-7 space-y-8" noValidate>
                {/* Honeypot — hidden from real users */}
                <div
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-10000px", top: "auto", width: "1px", height: "1px", overflow: "hidden" }}
                >
                  <label>
                    Website
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={form.website}
                      onChange={(e) => setForm({ ...form, website: e.target.value })}
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                  <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                </div>

            <div>
              <label className="eyebrow mb-3 block">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-transparent border-b border-foreground py-3 text-base focus:border-gold focus:outline-none transition-colors duration-300"
              >
                {["General", "Press", "Sync / Licensing", "Demo Submission", "Support"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="eyebrow mb-3 block">Message</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full bg-transparent border-b border-foreground py-3 text-base focus:border-gold focus:outline-none resize-none transition-colors duration-300"
              />
            </div>

                <div className="flex flex-wrap items-center gap-5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-3 border border-foreground bg-foreground px-9 py-4 text-[12px] font-medium uppercase tracking-[0.24em] text-gold hover:border-gold hover:bg-transparent hover:text-foreground transition-colors duration-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending…" : "Send Message"} <ArrowRight className="h-4 w-4" />
                  </button>
                  {errorMsg && <p className="font-serif text-lg italic text-golden-brown">{errorMsg}</p>}
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink px-6 py-16 text-center text-ivory md:px-12">
        <p className="font-serif text-3xl italic text-ivory/85 md:text-4xl">Music made with purpose.</p>
      </section>
    </main>
  );
};

const Field = ({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="eyebrow mb-3 block">{label}</label>
    <input
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-foreground py-3 text-base focus:border-gold focus:outline-none transition-colors duration-300"
    />
  </div>
);

export default Contact;

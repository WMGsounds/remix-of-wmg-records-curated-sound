import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/PageTitle";

const channels = [
  { label: "General Enquiries", email: "info@wmgsounds.com" },
  { label: "Press", email: "press@wmgsounds.com" },
  { label: "Licensing / Sync", email: "sync@wmg.com" },
  { label: "Artist & Demo Submissions", email: "demos@wmgrecords.com" },
];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "General", message: "" });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent", { description: "We'll be in touch shortly." });
    setForm({ name: "", email: "", subject: "General", message: "" });
  };

  return (
    <div className="pt-40 pb-32">
      <PageTitle title="Contact" />
      <div className="container-editorial">
        <p className="eyebrow mb-6">Contact</p>
        <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-16">Get in touch.</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5 space-y-10">
            {channels.map((c) => (
              <div key={c.label}>
                <p className="eyebrow mb-2">{c.label}</p>
                <a href={`mailto:${c.email}`} className="font-serif text-2xl md:text-3xl link-underline">
                  {c.email}
                </a>
              </div>
            ))}
          </div>

          <form onSubmit={onSubmit} className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            </div>

            <div>
              <label className="eyebrow mb-3 block">Subject</label>
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-transparent border-b border-foreground py-3 text-base focus:outline-none"
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
                className="w-full bg-transparent border-b border-foreground py-3 text-base focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="bg-foreground text-background px-10 py-4 text-[12px] uppercase tracking-[0.24em] hover:bg-accent hover:text-ink transition-colors duration-500"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
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
      className="w-full bg-transparent border-b border-foreground py-3 text-base focus:outline-none"
    />
  </div>
);

export default Contact;

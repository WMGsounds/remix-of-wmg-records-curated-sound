import { useState } from "react";
import { ArrowRight, X, CheckCircle2 } from "lucide-react";
import contactImage from "@/assets/contact-editorial.jpg";
import { PageTitle } from "@/components/PageTitle";
import { FileUploaderRegular } from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";

const UPLOADCARE_PUBLIC_KEY = import.meta.env.VITE_UPLOADCARE_PUBLIC_KEY as string | undefined;

const channels = [
  { label: "General Enquiries", email: "info@wmgsounds.com" },
  { label: "Press", email: "press@wmgsounds.com" },
  { label: "Licensing / Sync", email: "sync@wmgsounds.com" },
  { label: "Artist & Demo Submissions", email: "demos@wmgsounds.com" },
];

const MAX_DEMO_BYTES = 25 * 1024 * 1024;

type DemoUpload = {
  url: string;
  name: string;
  size: number;
};

const DEMO_SLOTS = [0, 1, 2] as const;
type DemoSlot = typeof DEMO_SLOTS[number];

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", subject: "General", message: "", website: "" });
  const [demoUploads, setDemoUploads] = useState<Record<DemoSlot, DemoUpload | null>>({ 0: null, 1: null, 2: null });
  const [demoErrors, setDemoErrors] = useState<Record<DemoSlot, string | null>>({ 0: null, 1: null, 2: null });
  const [uploadingMap, setUploadingMap] = useState<Record<DemoSlot, boolean>>({ 0: false, 1: false, 2: false });
  const [uploadProgressMap, setUploadProgressMap] = useState<Record<DemoSlot, number>>({ 0: 0, 1: 0, 2: 0 });
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isDemo = form.subject === "Demo Submission";
  const uploading = uploadingMap[0] || uploadingMap[1] || uploadingMap[2];

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || sent || uploading) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const demos = DEMO_SLOTS
        .map((i) => {
          const u = demoUploads[i];
          if (!u) return null;
          return { label: `Demo ${i + 1}`, url: u.url, filename: u.name, size: u.size };
        })
        .filter(Boolean);
      const payload = {
        ...form,
        demos,
      };
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        let detail = "";
        try {
          const data = await res.json();
          detail = data?.detail || data?.error || "";
        } catch {
          /* ignore */
        }
        console.error("[contact] Submit failed", res.status, detail);
        throw new Error(detail || "send_failed");
      }
      setSent(true);
      setForm({ name: "", email: "", subject: "General", message: "", website: "" });
      setDemoUploads({ 0: null, 1: null, 2: null });
      setUploadProgressMap({ 0: 0, 1: 0, 2: 0 });
    } catch (err: any) {
      setErrorMsg(err?.message ? `Something went wrong: ${err.message}` : "Something went wrong. Please email us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="bg-ink text-ivory">
      <PageTitle title="Contact" />
      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[30%_70%]">
        <div className="relative min-h-[40vh] overflow-hidden bg-ink lg:min-h-screen">
          <img
            src={contactImage}
            alt="Moody analog mixing console glowing in a darkened studio"
            className="absolute inset-0 h-full w-full object-cover object-left opacity-80 blur-[5px] scale-105"
            loading="eager"
            width={1024}
            height={1536}
          />
          <div className="absolute inset-0 bg-ink/40" aria-hidden="true" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,transparent_0,hsl(var(--ink)/0.35)_45%,hsl(var(--ink)/0.95)_100%)]" aria-hidden="true" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-r from-transparent to-ink hidden lg:block" aria-hidden="true" />
        </div>

        <div className="relative overflow-hidden bg-ink px-4 pb-24 pt-16 md:px-6 md:pb-32 md:pt-52 lg:pl-6 lg:pr-16 lg:pt-56 xl:pl-8 xl:pr-24">
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.5)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.4)_1px,transparent_1px)] [background-size:4px_4px]" aria-hidden="true" />
          <div className="relative">
            <p className="eyebrow mb-5 text-gold">Contact</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-6 text-ivory">Get in touch.</h1>
            <p className="font-serif text-2xl md:text-3xl leading-tight max-w-2xl mb-14 text-ivory/80">
              Send us a note. Whether it's press, sync, or new music, we read every message.
            </p>

            <div className="grid grid-cols-1 gap-20 xl:grid-cols-12 xl:gap-32">
              <div className="xl:col-span-5 xl:pt-[88px]">
                {channels.map((c) => (
                  <div key={c.label} className="border-t border-gold/20 py-3 last:border-b">
                    <p className="text-[10px] uppercase tracking-[0.2em] mb-1 text-gold/80">{c.label}</p>
                    <a href={`mailto:${c.email}`} className="text-sm leading-tight link-underline text-ivory/75 hover:text-ivory">
                      {c.email}
                    </a>
                  </div>
                ))}
              </div>

              {sent ? (
                <div className="xl:col-span-7">
                  <p className="font-serif text-2xl italic text-gold md:text-3xl">
                    Message sent. We'll be in touch.
                  </p>
                </div>
              ) : (
              <form onSubmit={onSubmit} className="xl:col-span-7 space-y-8" noValidate>
                {/* Honeypot */}
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
                  <label className="eyebrow mb-3 block text-gold">Subject</label>
                  <select
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full bg-transparent border-b border-ivory/40 py-3 text-base text-ivory focus:border-gold focus:outline-none transition-colors duration-300 [&>option]:text-ink"
                  >
                    {["General", "Press", "Sync / Licensing", "Demo Submission", "Support"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="eyebrow mb-3 block text-gold">Message</label>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-transparent border-b border-ivory/40 py-3 text-base text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none resize-none transition-colors duration-300"
                  />
                </div>

                {isDemo && (
                  <div>
                    <label className="eyebrow mb-3 block text-gold">Demo Submission (optional)</label>

                    {!UPLOADCARE_PUBLIC_KEY ? (
                      <p className="text-xs text-gold">
                        File uploads are not configured. Please set VITE_UPLOADCARE_PUBLIC_KEY.
                      </p>
                    ) : !demoUpload ? (
                      <div className="uploadcare-wrapper">
                        <FileUploaderRegular
                          pubkey={UPLOADCARE_PUBLIC_KEY}
                          multiple={false}
                          imgOnly={false}
                          accept="audio/mpeg,audio/mp3,audio/wav,audio/wave,audio/x-wav,audio/aiff,audio/x-aiff,audio/mp4,audio/x-m4a,.mp3,.wav,.aiff,.aif,.m4a"
                          maxLocalFileSizeBytes={MAX_DEMO_BYTES}
                          sourceList="local, dropbox, gdrive"
                          confirmUpload={false}
                          removeCopyright
                          onFileUploadStart={() => {
                            setUploading(true);
                            setUploadProgress(0);
                            setDemoError(null);
                          }}
                          onFileUploadProgress={(e: any) => {
                            const p = e?.progress ?? e?.detail?.progress ?? 0;
                            setUploadProgress(Math.round(p));
                          }}
                          onFileUploadFailed={(e: any) => {
                            setUploading(false);
                            setUploadProgress(0);
                            setDemoError(e?.errors?.[0]?.message ?? "Upload failed. Please try again.");
                          }}
                          onFileUploadSuccess={(e: any) => {
                            const url = e?.cdnUrl ?? e?.fileInfo?.cdnUrl;
                            const name = e?.fileInfo?.name ?? e?.name ?? "demo";
                            const size = e?.fileInfo?.size ?? e?.size ?? 0;
                            if (url) {
                              setDemoUpload({ url, name, size });
                            }
                            setUploading(false);
                            setUploadProgress(100);
                          }}
                          onCommonUploadFailed={(e: any) => {
                            setUploading(false);
                            setDemoError(e?.errors?.[0]?.message ?? "Upload failed. Please try again.");
                          }}
                        />
                        {uploading && (
                          <div className="mt-4">
                            <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-ivory/60 mb-2">
                              <span>Uploading…</span>
                              <span>{uploadProgress}%</span>
                            </div>
                            <div className="h-[2px] w-full bg-ivory/15 overflow-hidden">
                              <div
                                className="h-full bg-gold transition-all duration-200"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4 border border-gold/40 bg-ivory/5 px-5 py-4">
                        <div className="min-w-0 flex items-center gap-3">
                          <CheckCircle2 className="h-5 w-5 text-gold shrink-0" />
                          <div className="min-w-0">
                            <p className="font-serif text-base text-ivory truncate">{demoUpload.name}</p>
                            <p className="text-xs text-ivory/55 mt-1">
                              {demoUpload.size > 0 ? `${(demoUpload.size / (1024 * 1024)).toFixed(2)} MB · ` : ""}
                              Uploaded
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDemoUpload(null);
                            setUploadProgress(0);
                          }}
                          className="text-ivory/60 hover:text-gold transition-colors"
                          aria-label="Remove file"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-ivory/55 mt-3">
                      Maximum file size 25MB. Recommended format: MP3.
                    </p>
                    {demoError && <p className="text-xs text-gold mt-2">{demoError}</p>}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-5">
                  <button
                    type="submit"
                    disabled={submitting || uploading}
                    className="inline-flex items-center gap-2 border border-gold/60 bg-transparent px-5 py-2 text-[11px] font-normal uppercase tracking-[0.22em] text-gold hover:border-gold hover:bg-gold/10 transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending…" : uploading ? "Uploading…" : "Send Message"} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  {errorMsg && <p className="font-serif text-lg italic text-gold">{errorMsg}</p>}
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink px-6 py-16 text-center text-ivory md:px-12 border-t border-ivory/10">
        <p className="font-serif text-3xl italic text-ivory/85 md:text-4xl">Music made with purpose.</p>
      </section>
    </main>
  );
};

const Field = ({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div>
    <label className="eyebrow mb-3 block text-gold">{label}</label>
    <input
      type={type}
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-transparent border-b border-ivory/40 py-3 text-base text-ivory placeholder:text-ivory/40 focus:border-gold focus:outline-none transition-colors duration-300"
    />
  </div>
);

export default Contact;

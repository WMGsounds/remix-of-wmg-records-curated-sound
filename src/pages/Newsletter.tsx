import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { NewsletterForm } from "@/components/NewsletterForm";

const Newsletter = () => (
  <div className="bg-ink text-ivory pt-32 pb-16">
    <Seo
      title="Newsletter"
      description="Join the WMG Records list for new releases, limited editions and first access — sent rarely, only when there's something worth saying."
      canonicalPath="/newsletter"
      jsonLd={breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Newsletter", path: "/newsletter" },
      ])}
    />
    <div className="container-editorial max-w-3xl text-center">
      <p className="eyebrow mb-8 text-gold-soft">The List</p>
      <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl leading-[0.95]">
        Join the <span className="italic text-gold">List</span>.
      </h1>
      <p className="mt-10 text-lg md:text-xl text-ivory/80 max-w-xl mx-auto leading-relaxed">
        New releases. Limited editions. First access. We send rarely — only when there's something
        worth saying.
      </p>
      <div className="mt-14 flex justify-center">
        <NewsletterForm />
      </div>
      <p className="mt-12 text-xs uppercase tracking-[0.24em] text-ivory/50">
        No spam · Unsubscribe at any time
      </p>
    </div>
  </div>
);

export default Newsletter;

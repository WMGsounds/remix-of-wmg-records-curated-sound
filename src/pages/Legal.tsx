import { useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";

const copy: Record<string, { title: string; description: string; body: string[] }> = {
  privacy: {
    title: "Privacy Policy",
    description: "How WMG Records (Wareham Music Group) collects, uses and protects information submitted through this website.",
    body: [
      "This Privacy Policy describes how Wareham Music Group ('WMG', 'we', 'our') collects, uses and protects information you provide when using this website.",
      "We collect only the minimum information required to operate the site and our services — including email addresses submitted to our newsletter and messages submitted via our contact form.",
      "We do not sell your personal data. For any privacy enquiry, contact privacy@wmgsounds.com.",
    ],
  },
  terms: {
    title: "Terms of Use",
    description: "Terms governing use of the WMG Records website, including content rights and acceptable use.",
    body: [
      "By accessing this website you agree to these Terms of Use. All content on this site, including images, audio, video and text, is the property of Wareham Music Group or its licensors and is protected by copyright.",
      "You may not reproduce, distribute or commercially exploit any material from this site without prior written consent.",
    ],
  },
  cookies: {
    title: "Cookies",
    description: "Information about how WMG Records uses cookies on this website.",
    body: [
      "This site uses a small number of essential cookies to operate properly. Optional analytics cookies may be used to help us understand how the site is used. You can control cookies through your browser settings.",
    ],
  },
};

const Legal = () => {
  const { doc } = useParams();
  const key = (doc && doc in copy) ? doc : "privacy";
  const page = copy[key];
  const path = `/legal/${key}`;

  return (
    <div className="pt-40 pb-32">
      <Seo
        title={page.title}
        description={page.description}
        canonicalPath={path}
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: page.title, path },
        ])}
      />
      <div className="container-editorial max-w-3xl">
        <p className="eyebrow mb-6">Legal</p>
        <h1 className="display-serif text-5xl md:text-7xl mb-12">{page.title}</h1>
        <div className="space-y-6 text-lg leading-relaxed font-light">
          {page.body.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <p className="text-sm text-muted-foreground mt-16">Last updated: April 2026</p>
      </div>
    </div>
  );
};

export default Legal;

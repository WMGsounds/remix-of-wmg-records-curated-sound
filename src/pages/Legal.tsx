import { useParams } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { LEGAL_DOCS, seoFor } from "@/lib/seoConfig";

const Legal = () => {
  const { doc } = useParams();
  const key = doc && doc in LEGAL_DOCS ? doc : "privacy";
  const page = LEGAL_DOCS[key];

  return (
    <div className="pt-40 pb-32">
      <Seo {...seoFor.legal(key)} />
      <div className="container-editorial max-w-3xl">
        <p className="eyebrow mb-6">Legal</p>
        <h1 className="display-serif text-5xl md:text-7xl mb-12">{page.title}</h1>
        <div className="space-y-6 text-lg leading-relaxed font-light">
          {page.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <p className="text-sm text-muted-foreground mt-16">Last updated: April 2026</p>
      </div>
    </div>
  );
};

export default Legal;

import { Seo } from "@/components/Seo";
import { breadcrumbSchema } from "@/lib/seo";
import { useStoreItems } from "@/lib/queries";
import { InlineSkeleton, PageError } from "@/components/UIStates";
import { StoreCard } from "@/components/StoreCard";
import storeHeroAsset from "@/assets/store-hero.png.asset.json";

const Store = () => {
  const { data: items = [], isLoading, isError } = useStoreItems();

  if (isError) return <PageError message="Couldn't load the store." />;

  const visible = items.filter((i) => i.availability !== "Hidden");

  return (
    <div className="bg-ink text-ivory pb-32">
      <Seo
        title="Store | WMG"
        description="Buy WMG releases on vinyl, CD and digital. Limited editions, bundles and signed copies from Wareham Music Group artists."
        canonicalPath="/store"
        jsonLd={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Store", path: "/store" },
        ])}
      />

      <section className="relative overflow-hidden bg-ink pt-40 pb-24 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_38%,hsl(var(--golden-brown)/0.38),transparent_34%),radial-gradient(circle_at_18%_78%,hsl(var(--gold)/0.16),transparent_28%)]" aria-hidden="true" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(90deg,hsl(var(--ivory)/0.8)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--ivory)/0.8)_1px,transparent_1px)] [background-size:3px_3px]" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_42%,hsl(var(--ink)/0.72)_100%)]" aria-hidden="true" />
        <div className="relative container-editorial grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow mb-6 text-gold-soft">The Store</p>
            <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl mb-10">Store</h1>
            <p className="max-w-2xl text-lg text-ivory/65">
              Records, bundles and limited editions from the WMG roster. Each item links directly to its
              dedicated purchase page. No cart, no checkout, just the music.
            </p>
          </div>
          <div className="relative hidden min-h-[360px] lg:block">
            <div className="absolute right-0 top-1/2 h-[560px] w-full -translate-y-1/2 overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-image:linear-gradient(90deg,transparent_0%,rgba(0,0,0,0.08)_14%,rgba(0,0,0,0.42)_26%,black_44%,black_56%,rgba(0,0,0,0.42)_74%,rgba(0,0,0,0.08)_86%,transparent_100%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
              <div className="h-full w-full [-webkit-mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-image:radial-gradient(ellipse_at_center,black_18%,rgba(0,0,0,0.68)_38%,rgba(0,0,0,0.28)_58%,transparent_78%)] [mask-repeat:no-repeat] [mask-size:100%_100%]">
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${storeHeroAsset.url})` }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-ink" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/35" aria-hidden="true" />
      </section>

      <div className="container-editorial pt-16">

        {isLoading ? (
          <InlineSkeleton count={6} />
        ) : visible.length === 0 ? (
          <div className="max-w-2xl py-16">
            <p className="eyebrow mb-4">Coming Soon</p>
            <h2 className="display-serif text-3xl md:text-4xl mb-6">The store is being prepared.</h2>
            <p className="text-ivory/65">
              We're getting the next batch of records ready. Check back shortly, or follow the journal
              for release news.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 md:gap-10">
            {visible.map((item) => (
              <StoreCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Store;

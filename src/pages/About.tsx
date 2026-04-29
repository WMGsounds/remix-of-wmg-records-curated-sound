import hero from "@/assets/hero-cinematic.jpg";
import { PageTitle } from "@/components/PageTitle";

const About = () => (
  <div>
    <PageTitle title="About" />
    <section className="relative h-[60vh] min-h-[420px] bg-ink text-ivory overflow-hidden">
      <img src={hero} alt="WMG" className="absolute inset-0 h-full w-full object-cover opacity-50" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
      <div className="relative z-10 h-full container-editorial flex flex-col justify-end pb-16">
        <p className="eyebrow text-ivory/70 mb-4">About</p>
        <h1 className="display-serif text-6xl md:text-9xl">A label, not a factory.</h1>
      </div>
    </section>

    <section className="container-editorial py-28 md:py-36 grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-4">
        <p className="eyebrow mb-4">Our Story</p>
        <div className="gold-rule" />
      </div>
      <div className="lg:col-span-8 space-y-6 text-lg md:text-xl leading-relaxed font-light">
        <p>
          WMG (Wareham Music Group) was founded on a simple instinct: that the most enduring
          records still come from a small room, a careful ear, and an artist with something to say.
        </p>
        <p>
          We work from London, releasing music we believe in and building it
          slowly. We're not chasing trend or scale. We're building catalogue.
        </p>
      </div>
    </section>

    <section className="bg-secondary py-28 md:py-36">
      <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <p className="eyebrow mb-4">Our Sound</p>
          <div className="gold-rule" />
        </div>
        <div className="lg:col-span-8 space-y-6 text-lg md:text-xl leading-relaxed font-light">
          <p>
            We don't sit inside a single genre. Our roster spans soul and gospel, country and
            americana, reggae and contemporary classical — but every record shares a sensibility:
            warmth, restraint, and a respect for the song.
          </p>
        </div>
      </div>
    </section>

    <section className="container-editorial py-28 md:py-36 grid grid-cols-1 lg:grid-cols-12 gap-12">
      <div className="lg:col-span-4">
        <p className="eyebrow mb-4">Our Artists</p>
        <div className="gold-rule" />
      </div>
      <div className="lg:col-span-8 space-y-6 text-lg md:text-xl leading-relaxed font-light">
        <p>
          We sign artists, not songs. Each WMG signing is a long-form commitment — to a body of
          work, to a visual language, to the world an artist is trying to build. We are
          collaborators, not gatekeepers.
        </p>
      </div>
    </section>

    <section className="bg-ink text-ivory py-32">
      <div className="container-editorial max-w-4xl">
        <p className="display-serif text-3xl md:text-5xl leading-[1.15]">
          Make records that <span className="italic text-gold">outlast</span> the moment they were
          made in.
        </p>
      </div>
    </section>
  </div>
);

export default About;

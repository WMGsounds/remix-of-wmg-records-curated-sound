import hero from "@/assets/hero-cinematic.jpg";
import artist1 from "@/assets/artist-1.jpg";
import artist3 from "@/assets/artist-3.jpg";
import aboutSoundBg from "@/assets/about-sound-bg.png";
import { PageTitle } from "@/components/PageTitle";

const About = () => (
  <div>
    <PageTitle title="About" />
    <section className="relative h-[82vh] min-h-[620px] bg-ink text-ivory overflow-hidden">
      <img src={hero} alt="Low-lit studio atmosphere" className="absolute inset-0 h-[112%] w-full object-cover opacity-55 motion-safe:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/35 to-ink/10" />
      <div className="relative z-10 h-full container-editorial grid grid-cols-1 lg:grid-cols-12 items-end gap-10 pb-16 md:pb-24">
        <div className="lg:col-span-8 animate-fade-up">
          <p className="eyebrow text-gold mb-5">About WMG</p>
          <h1 className="display-serif text-6xl md:text-8xl lg:text-9xl max-w-5xl">A label, not a factory.</h1>
        </div>
        <p className="lg:col-span-4 max-w-md text-base md:text-lg leading-relaxed text-gold italic animate-fade-in">
          Built for records with atmosphere, patience, and a point of view. A small room for lasting work.
        </p>
      </div>
    </section>

    <section className="container-editorial py-24 md:py-36">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-start">
        <div className="lg:col-span-5 reveal-on-scroll">
          <p className="eyebrow text-gold mb-5">Our Story</p>
          <div className="gold-rule mb-10" />
          <p className="display-serif text-4xl md:text-6xl leading-[1.02]">
            Records still come from a careful ear.
          </p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 space-y-7 text-lg md:text-xl leading-relaxed font-light reveal-on-scroll">
          <p>
            WMG (Wareham Music Group) was founded on a simple instinct: that the most enduring
            records still come from a small room, a careful ear, and an artist with something to say.
          </p>
          <p>
            We work from London, releasing music we believe in and building it
            slowly. We're not chasing trend or scale. We're building catalogue.
          </p>
        </div>
      </div>
    </section>

    <section className="relative overflow-hidden bg-ink py-16 md:py-24 text-ivory">
      <img src={aboutSoundBg} alt="Singer recording in a warm studio" className="absolute inset-0 h-full w-full object-cover object-center opacity-15" />
      <div className="absolute inset-0 bg-ink/86" />
      <div className="relative container-editorial grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10 md:gap-x-16">
          <p className="lg:col-span-2 display-serif text-3xl md:text-5xl lg:text-6xl leading-[1.02] reveal-on-scroll">
              Warmth, restraint, and respect for the song.
          </p>
          <div className="reveal-on-scroll">
            <p className="eyebrow text-gold-soft mb-3">Our Sound</p>
            <div className="gold-rule" />
          </div>
          <div className="reveal-on-scroll">
            <p className="eyebrow text-gold-soft mb-3">Our Artists</p>
            <div className="gold-rule" />
          </div>
          <div className="reveal-on-scroll">
            <div className="space-y-4 text-sm md:text-base leading-relaxed font-light text-ivory/88">
              <p>
                We don't sit inside a single genre. Our roster spans soul and gospel, country and
                americana, reggae and contemporary classical, crooner and jazz, and more. Every single 
                record shares a sensibility: warmth, restraint, and a respect for the song.
              </p>
              <p>
                We look for music with atmosphere and intention: voices that feel lived-in, arrangements
                that leave room, and records that can carry their own weather.
              </p>
            </div>
          </div>
          <div className="reveal-on-scroll">
            <div className="space-y-4 text-sm md:text-base leading-relaxed font-light text-ivory/88">
              <p>
                We sign artists, not songs. Each WMG signing is a long-form commitment.
                To a body of work, to a visual language, to the world an artist is trying to build
                and to the sound they are working to capture. We are collaborators, not gatekeepers.
              </p>
              <p>
                The aim is not to force an artist into shape, but to protect what already makes them
                distinct, then give that world the space, care, and context it deserves.
              </p>
            </div>
          </div>
      </div>
    </section>

    <section className="bg-golden-brown/78 py-16 md:py-24 text-ivory">
      <div className="container-editorial reveal-on-scroll">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-x-14 lg:gap-x-20">
          {[
          ["01", "Build slowly", "No trend-chasing, no disposable campaigns. Only catalogue with a lasting future."],
          ["02", "Listen closely", "The song leads; production, image, and strategy follow with restraint."],
          ["03", "Outlast the moment", "We're not here for the cycle. We're here for the catalogue that survives it."],
          ].map(([number, title, text]) => (
          <div key={number} className="relative md:pt-6">
            <p className="text-gold-soft/75 font-serif text-2xl mb-5">{number}</p>
            <div className="h-px w-16 bg-ivory/25 mb-8" />
            <h2 className="font-serif text-3xl md:text-4xl mb-5">{title}</h2>
            <p className="text-ivory/84 leading-relaxed max-w-sm">{text}</p>
          </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-ink text-ivory pt-10 pb-14 md:pb-20">
      <div className="container-editorial max-w-5xl reveal-on-scroll">
        <div className="gold-rule mb-10" />
        <p className="display-serif text-4xl md:text-7xl leading-[1.08]">
          Make records that <span className="italic text-gold">outlast</span> the moment they were
          made in.
        </p>
      </div>
    </section>

    <section className="bg-ink text-ivory pt-8 pb-24 md:pt-10 md:pb-32">
      <div className="container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-16 items-center">
        <div className="lg:col-span-5 reveal-on-scroll">
          <div className="aspect-[4/5] overflow-hidden bg-ivory/10">
            <img src={artist3} alt="Portrait placeholder for WMG founders" className="h-full w-full object-cover opacity-85 grayscale" />
          </div>
        </div>
        <div className="lg:col-span-6 lg:col-start-7 reveal-on-scroll">
          <p className="eyebrow text-gold mb-5">The People</p>
          <div className="gold-rule mb-10" />
          <h2 className="display-serif text-5xl md:text-7xl mb-8">A small team with a long view.</h2>
          <p>
            Founded and run by people who believe records deserve time, context, and care. This space
            can introduce the label's founders, creative leads, and collaborators - the ears behind the catalogue.
          </p>
        </div>
      </div>
    </section>

    <section className="relative bg-ink text-ivory overflow-hidden py-24 md:py-32">
      <img src={artist1} alt="Artist in a moody performance setting" className="absolute inset-0 h-[120%] w-full object-cover opacity-35 motion-safe:translate-y-[-4%]" />
      <div className="absolute inset-0 bg-ink/55" />
      <div className="relative container-editorial grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
        <blockquote className="lg:col-span-8 display-serif text-5xl md:text-7xl leading-[1.03] reveal-on-scroll">
          “We sign artists, <span className="italic text-gold">not songs</span>.”
        </blockquote>
        <div className="lg:col-span-4 text-ivory/76 text-lg leading-relaxed reveal-on-scroll">
          Each signing is treated as a world to build: sound, image, patience, and the long arc of a catalogue.
        </div>
      </div>
    </section>
  </div>
);

export default About;

import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import logo from "@/assets/wmg-logo-stacked.png";
import footerLogo from "@/assets/wmg-logo-full.png";


const nav = [
  { to: "/", label: "Home" },
  { to: "/artists", label: "Artists" },
  { to: "/releases", label: "Releases" },
  { to: "/journal", label: "Journal" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 overflow-hidden backdrop-blur-md border-b border-ivory/10 text-ivory shadow-sm"
    >
      <div className="pointer-events-none absolute inset-0 bg-ink/85 md:bg-ink/70" />

      <div className="container-editorial relative z-10 flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-3" aria-label="WMG Records home">
          <img src={logo} alt="WMG Records" loading="eager" width={240} height={320} className="h-16 md:h-20 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-[12px] uppercase tracking-[0.24em] link-underline transition-colors ${
                  isActive ? "text-gold font-bold" : "text-ivory/70 font-medium hover:text-ivory"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-6">
          <Link
            to="/store"
            className="inline-flex items-center gap-3 border border-gold bg-gold px-6 py-2.5 text-[12px] font-medium uppercase tracking-[0.24em] text-ink hover:bg-transparent hover:text-gold transition-colors duration-500"
          >
            Store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          aria-label="Toggle menu"
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen((s) => !s)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="relative z-10 md:hidden border-t border-gold/30 bg-ink text-ivory shadow-soft">
          <nav className="container-editorial flex flex-col py-8 gap-3" aria-label="Mobile navigation">
            {[...nav, { to: "/store", label: "Store" }].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `group flex min-h-12 items-center justify-between font-serif text-3xl leading-none transition-colors duration-300 ${
                    isActive ? "text-gold" : "text-ivory hover:text-gold"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    <span
                      className={`h-px w-12 origin-right transition-transform duration-500 ${
                        isActive ? "scale-x-100 bg-gold" : "scale-x-0 bg-ivory group-hover:scale-x-100 group-hover:bg-gold"
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export const SiteFooter = () => (
  <footer className="relative bg-ink text-ivory">
    <div className="absolute inset-x-0 top-0 h-px bg-gold" aria-hidden="true" />
    <div className="container-editorial py-12 grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
      <div className="self-start">
        <Link to="/" className="inline-block mb-5" aria-label="WMG Records — Wareham Music Group">
          <img
            src={footerLogo}
            alt="WMG Records — Wareham Music Group"
            loading="lazy"
            width={640}
            height={220}
            className="w-full max-w-[280px] h-auto"
          />
        </Link>
        <address className="not-italic text-sm text-ivory/65 leading-relaxed">
          <p className="font-medium text-ivory">WMG Records</p>
          <p>Wareham Music Group</p>
          <p>London, United Kingdom</p>
          <p>
            <a href="https://www.wmgsounds.com" className="link-underline hover:text-ivory">www.wmgsounds.com</a>
          </p>
        </address>
      </div>

      <div className="md:text-center">
        <p className="eyebrow mb-3 text-gold">Contact</p>
        <ul className="space-y-1.5 text-sm text-ivory/70">
          <li><a href="mailto:info@wmgsounds.com" className="link-underline hover:text-ivory">info@wmgsounds.com</a></li>
          <li><a href="mailto:press@wmgsounds.com" className="link-underline hover:text-ivory">press@wmgsounds.com</a> <span className="text-ivory/40">— Press</span></li>
          <li><a href="mailto:sync@wmgsounds.com" className="link-underline hover:text-ivory">sync@wmgsounds.com</a> <span className="text-ivory/40">— Licensing</span></li>
          <li><a href="mailto:demos@wmgsounds.com" className="link-underline hover:text-ivory">demos@wmgsounds.com</a> <span className="text-ivory/40">— Submissions</span></li>
        </ul>
      </div>

      <div className="md:text-right md:justify-self-end self-start">
        <p className="eyebrow mb-3 text-gold">Explore</p>
        <ul className="space-y-1.5 text-sm">
          {nav.map((n) => (
            <li key={n.to}>
              <Link to={n.to} className="link-underline text-ivory/70 hover:text-ivory transition-colors">
                {n.label}
              </Link>
            </li>
          ))}
          <li>
            <Link to="/newsletter" className="link-underline text-ivory/70 hover:text-ivory transition-colors">
              Newsletter
            </Link>
          </li>
          <li>
            <Link to="/store" className="link-underline text-ivory/70 hover:text-ivory transition-colors">
              Store
            </Link>
          </li>
        </ul>
      </div>
    </div>

    <div className="border-t border-ivory/15">
      <div className="container-editorial py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs text-ivory/60">
        <p>© {new Date().getFullYear()} Wareham Music Group. All rights reserved.</p>
        <div className="flex gap-6">
          <Link to="/legal/privacy" className="link-underline hover:text-ivory transition-colors">Privacy</Link>
          <Link to="/legal/terms" className="link-underline hover:text-ivory transition-colors">Terms</Link>
          <Link to="/legal/cookies" className="link-underline hover:text-ivory transition-colors">Cookies</Link>
        </div>
      </div>
    </div>
  </footer>
);

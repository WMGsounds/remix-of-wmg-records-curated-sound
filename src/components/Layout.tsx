import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/wmg-logo-stacked.png";
import footerLogo from "@/assets/wmg-logo-full.png";
import hero from "@/assets/hero-cinematic.jpg";

const nav = [
  { to: "/", label: "Home" },
  { to: "/artists", label: "Artists" },
  { to: "/releases", label: "Releases" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const usesImageLedTopSection = location.pathname === "/"
    || location.pathname === "/about"
    || /^\/artists\/[^/]+/.test(location.pathname)
    || /^\/releases\/[^/]+/.test(location.pathname);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 overflow-hidden backdrop-blur-md border-b border-ivory/10 text-ivory shadow-sm"
    >
      {!usesImageLedTopSection && (
        <img
          src={hero}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top opacity-70"
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-ink/70" />

      <div className="container-editorial relative z-10 flex items-center justify-between py-5">
        <Link to="/" className="flex items-center gap-3" aria-label="WMG Records home">
          <img src={logo} alt="WMG Records" className="h-16 md:h-20 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-10">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-[12px] uppercase tracking-[0.24em] font-medium link-underline transition-colors ${
                  isActive ? "text-ivory" : "text-ivory/70 hover:text-ivory"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-6">
          {/* Future: Shop link slot */}
          <Link
            to="/newsletter"
            className="text-[12px] uppercase tracking-[0.24em] font-medium border border-ivory/60 text-ivory px-5 py-2.5 hover:bg-ivory hover:text-ink transition-colors duration-500"
          >
            Newsletter
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
        <div className="md:hidden border-t border-border bg-background">
          <nav className="container-editorial flex flex-col py-6 gap-5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className="font-serif text-2xl"
              >
                {item.label}
              </NavLink>
            ))}
            <Link to="/newsletter" className="font-serif text-2xl text-accent">
              Newsletter
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export const SiteFooter = () => (
  <footer className="border-t border-border bg-ink text-ivory mt-20">
    <div className="container-editorial py-10 grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 md:gap-10 items-start">
      <div className="flex items-center self-stretch">
        <Link to="/" className="inline-block" aria-label="WMG Records — Wareham Music Group">
          <img
            src={footerLogo}
            alt="WMG Records — Wareham Music Group"
            className="w-full max-w-[280px] h-auto"
          />
        </Link>
      </div>

      <div className="md:pl-16 lg:pl-28">
        <p className="eyebrow mb-3 text-gold">Explore</p>
        <ul className="space-y-1.5 text-sm">
          {nav.map((n) => (
            <li key={n.to}>
              <Link to={n.to} className="link-underline text-ivory/70 hover:text-ivory transition-colors">
                {n.label}
              </Link>
            </li>
          ))}
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

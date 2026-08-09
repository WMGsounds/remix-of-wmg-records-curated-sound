import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import logo from "@/assets/wmg-logo-stacked.png";
import footerLogo from "@/assets/wmg-logo-full.png";
import { SocialLinks } from "@/components/SocialLinks";



type NavItem = { to: string; label: string; children?: { to: string; label: string }[] };

const nav: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/artists", label: "Artists" },
  { to: "/releases", label: "Releases" },
  { to: "/journal", label: "Journal" },
  {
    to: "/videos",
    label: "Media",
    children: [
      { to: "/videos", label: "Videos" },
      { to: "/music", label: "Music" },
      { to: "/gallery", label: "Gallery" },
    ],
  },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

// Flat list used by the footer — Media is expanded into its children.
const footerNav = nav.flatMap((item) => (item.children ? item.children : [item]));

const storeNav = { to: "/store", label: "Store" };

const MediaMenu = ({ item }: { item: NavItem }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const ref = useRef<HTMLDivElement>(null);
  const children = item.children ?? [];
  const isActive = children.some((c) => location.pathname === c.to || location.pathname.startsWith(`${c.to}/`));

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="media-menu"
        aria-haspopup="true"
        onClick={() => setOpen((s) => !s)}
        className={`flex items-center gap-1.5 text-[12px] uppercase tracking-[0.24em] link-underline transition-colors ${
          isActive ? "text-gold font-bold" : "text-ivory/70 font-medium hover:text-ivory"
        }`}
      >
        {item.label}
        <ChevronDown className={`h-3 w-3 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          id="media-menu"
          className="absolute left-1/2 top-full z-[60] min-w-[180px] -translate-x-1/2 border border-ivory/15 bg-ink/95 backdrop-blur-md py-2 shadow-soft"
        >
          {children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              onClick={() => setOpen(false)}
              className={({ isActive: childActive }) =>
                `block px-5 py-2.5 text-[12px] uppercase tracking-[0.24em] transition-colors ${
                  childActive ? "text-gold font-bold" : "text-ivory/70 font-medium hover:text-ivory"
                }`
              }
            >
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};


export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    setMediaOpen(false);
  }, [location.pathname]);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 overflow-visible backdrop-blur-md border-b border-ivory/10 text-ivory shadow-sm"
    >
      <div className="pointer-events-none absolute inset-0 bg-ink/85 md:bg-ink/70" />

      <div className="container-editorial relative z-10 flex items-center justify-between py-5 md:grid md:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Link to="/" className="flex items-center gap-3" aria-label="WMG home">
          <img src={logo} alt="WMG" loading="eager" width={240} height={320} className="h-16 md:h-20 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-10 md:justify-self-center">
          {nav.map((item) =>
            item.children ? (
              <MediaMenu key={item.label} item={item} />
            ) : (
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
            ),
          )}
        </nav>


        <div className="hidden md:flex justify-end">
          <NavLink
            to={storeNav.to}
            className={({ isActive }) =>
              `inline-flex items-center border border-gold px-4 py-2 text-[12px] uppercase tracking-[0.24em] transition-colors duration-300 ${
                isActive
                  ? "bg-gold text-ink font-bold"
                  : "text-gold font-medium hover:bg-gold hover:text-ink"
              }`
            }
          >
            {storeNav.label}
          </NavLink>
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
            {nav.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <button
                    type="button"
                    aria-expanded={mediaOpen}
                    aria-controls="mobile-media-menu"
                    onClick={() => setMediaOpen((s) => !s)}
                    className={`group flex w-full min-h-12 items-center justify-between font-serif text-3xl leading-none transition-colors duration-300 ${
                      item.children.some((c) => location.pathname.startsWith(c.to)) ? "text-gold" : "text-ivory hover:text-gold"
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`h-5 w-5 transition-transform duration-300 ${mediaOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {mediaOpen && (
                    <div id="mobile-media-menu" className="mt-1 flex flex-col gap-1 border-l border-gold/30 pl-5">
                      {item.children.map((child) => (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) =>
                            `flex min-h-11 items-center font-serif text-2xl leading-none transition-colors duration-300 ${
                              isActive ? "text-gold" : "text-ivory/80 hover:text-gold"
                            }`
                          }
                        >
                          {child.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
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
              ),
            )}

            <NavLink
              to={storeNav.to}
              className={({ isActive }) =>
                `group flex min-h-12 items-center justify-between font-serif text-3xl leading-none border-t border-gold/30 pt-3 mt-1 transition-colors duration-300 ${
                  isActive ? "text-gold" : "text-gold hover:text-ivory"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{storeNav.label}</span>
                  <span
                    className={`h-px w-12 origin-right transition-transform duration-500 ${
                      isActive ? "scale-x-100 bg-gold" : "scale-x-0 bg-gold group-hover:scale-x-100 group-hover:bg-ivory"
                    }`}
                  />
                </>
              )}
            </NavLink>
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
        <Link to="/" className="inline-block mb-5 -ml-12 md:-ml-14" aria-label="WMG — Wareham Music Group">
          <img
            src={footerLogo}
            alt="WMG — Wareham Music Group"
            loading="lazy"
            width={640}
            height={220}
            className="block w-full max-w-[280px] h-auto"
          />
        </Link>
        <address className="not-italic text-sm text-ivory/65 leading-relaxed">
          <p className="font-medium text-ivory">WMG</p>
          <p>Wareham Music Group</p>
          <p>London, United Kingdom</p>
          <p>
            <a href="https://www.wmgsounds.com" className="link-underline hover:text-ivory">www.wmgsounds.com</a>
          </p>
        </address>
        {/* Visible, crawlable profile links — same URLs as Organization sameAs. */}
        <SocialLinks className="mt-5" />

      </div>

      <div className="md:text-center">
        <p className="eyebrow mb-3 text-gold">Contact</p>
        <ul className="space-y-1.5 text-sm text-ivory/70">
          <li><a href="mailto:info@wmgsounds.com" className="link-underline hover:text-ivory">info@wmgsounds.com</a> <span className="text-ivory/70">(General)</span></li>
          <li><a href="mailto:press@wmgsounds.com" className="link-underline hover:text-ivory">press@wmgsounds.com</a> <span className="text-ivory/70">(Press)</span></li>
          <li><a href="mailto:sync@wmgsounds.com" className="link-underline hover:text-ivory">sync@wmgsounds.com</a> <span className="text-ivory/70">(Licensing)</span></li>
          <li><a href="mailto:demos@wmgsounds.com" className="link-underline hover:text-ivory">demos@wmgsounds.com</a> <span className="text-ivory/70">(Submissions)</span></li>
        </ul>
      </div>

      <div className="md:text-right md:justify-self-end">
        <p className="eyebrow mb-3 text-gold">Explore</p>
        <ul className="space-y-1.5 text-sm">
          {footerNav.map((n) => (
            <li key={n.to}>
              <Link to={n.to} className="link-underline text-ivory/70 hover:text-ivory transition-colors">
                {n.label}
              </Link>
            </li>
          ))}
          <li>
            <Link to={storeNav.to} className="link-underline text-ivory/70 hover:text-ivory transition-colors">
              {storeNav.label}
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

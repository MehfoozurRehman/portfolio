"use client";

import { useEffect, useState } from "react";

import { ThemeToggle } from "./theme-toggle";

const links = [
  { label: "About", href: "#about" },
  { label: "Services", href: "#services" },
  { label: "Work", href: "#work" },
  { label: "Experience", href: "#experience" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const ids = [...links.map((l) => l.href.slice(1)), "contact"];

    const onScroll = () => {
      if (window.scrollY < 120) {
        setActive("");
        return;
      }

      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4
      ) {
        setActive(`#${ids[ids.length - 1]}`);
        return;
      }

      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 130) {
          current = `#${id}`;
        }
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const goTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", "#page-top");
    setOpen(false);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:pt-4">
      <nav
        className={`pointer-events-auto flex w-full max-w-[1320px] items-center justify-between gap-2 rounded-2xl border px-3 py-2 transition-all duration-300 sm:px-4 ${
          scrolled
            ? "border-[var(--border-card)] bg-[var(--color-page-soft)]/80 shadow-[0_10px_40px_-24px_var(--shadow-strong)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <a
          href="#page-top"
          onClick={goTop}
          aria-label="Mehfooz-ur-Rehman — home"
          className="group flex items-center gap-2.5"
        >
          <span className="grid size-9 place-items-center">
            <svg viewBox="0 0 169 168" className="size-9" fill="none" aria-hidden="true">
              <path
                d="M84.5 15.25a19.875 19.875 0 0 0-14.1 5.817L21.36 69.816A19.863 19.863 0 0 0 15.46 84a19.863 19.863 0 0 0 5.9 14.184l49.04 48.75a19.875 19.875 0 0 0 14.1 5.815c5.32 0 10.327-2.065 14.1-5.816l49.04-48.749A19.863 19.863 0 0 0 153.54 84a19.863 19.863 0 0 0-5.9-14.184L98.6 21.066a19.875 19.875 0 0 0-14.1-5.815Z"
                stroke="var(--color-accent)"
                strokeWidth="8"
                strokeLinejoin="round"
              />
              <path
                d="M109.742 106.619h-5.735V76.227L85.145 95.288c-1.093-1-1.693-1.5-2.246-2.053-7-6.995-13.949-14.049-21.033-20.96-1.808-1.764-2.9-3.515-2.539-6.11a37.276 37.276 0 0 0 .035-4.712l25.064 25.263 25.317-25.508ZM65.306 92.218v14.376h-5.823V77.96l28.716 28.791c-2.085 0-4.413.131-6.713-.069a4.517 4.517 0 0 1-2.355-1.468c-4.416-4.4-8.777-8.848-13.156-13.282Z"
                fill="var(--color-text)"
              />
            </svg>
          </span>
          <span className="hidden font-mono-label text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-text)] sm:block">
            Mehfooz
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`rounded-full px-3.5 py-2 font-mono-label text-[0.7rem] font-semibold uppercase tracking-[0.14em] transition ${
                active === link.href
                  ? "bg-[var(--color-field)] text-[var(--color-accent)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="hidden rounded-full bg-[var(--color-inverse)] px-4 py-2 font-mono-label text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[var(--color-inverse-text)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] sm:inline-flex"
          >
            Contact
          </a>
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-full border border-[var(--border-card)] text-[var(--color-text)] transition hover:border-[var(--border-hover)] md:hidden"
          >
            <span className="relative block h-3 w-4">
              <span
                className={`absolute left-0 h-0.5 w-4 bg-current transition-all ${open ? "top-1.5 rotate-45" : "top-0"}`}
              />
              <span
                className={`absolute left-0 top-1.5 h-0.5 w-4 bg-current transition-all ${open ? "opacity-0" : "opacity-100"}`}
              />
              <span
                className={`absolute left-0 h-0.5 w-4 bg-current transition-all ${open ? "top-1.5 -rotate-45" : "top-3"}`}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        className={`pointer-events-auto fixed inset-x-3 top-[68px] z-40 origin-top rounded-2xl border border-[var(--border-card)] bg-[var(--color-page-soft)]/95 p-2 shadow-[0_20px_60px_-30px_var(--shadow-strong)] backdrop-blur-xl transition-all duration-200 md:hidden ${
          open
            ? "scale-100 opacity-100"
            : "pointer-events-none scale-95 opacity-0"
        }`}
      >
        {[...links, { label: "Contact", href: "#contact" }].map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-xl px-4 py-3 font-mono-label text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] transition hover:bg-[var(--color-field)] hover:text-[var(--color-accent)]"
          >
            {link.label}
            <span className="text-[var(--color-soft)]">→</span>
          </a>
        ))}
      </div>
    </header>
  );
}

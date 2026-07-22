import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Code2,
  GraduationCap,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  education,
  experience,
  process,
  profile,
  profileHighlights,
  projects,
  services,
  stack,
  testimonials,
} from "../data";

import { ContactForm } from "../components/contact-form";
import { GitHubCalendarSection } from "../components/github-calendar";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "../components/reveal";
import { SiteNav } from "../components/site-nav";

const shell = "mx-auto w-full max-w-[1320px] px-5 sm:px-8 lg:px-10";
const eyebrow =
  "inline-flex items-center gap-2 font-mono-label text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]";
const display =
  "font-[family-name:var(--font-nunito)] font-extrabold leading-[0.98] tracking-[-0.01em]";

function getProjectLogoSrc(project: { url?: string; logoUrl?: string }) {
  if (project.logoUrl) return project.logoUrl;
  if (!project.url) return null;
  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(project.url).hostname}&sz=128`;
  } catch {
    return null;
  }
}

function SectionMarker({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-8 flex items-center gap-3">
      <span className="font-mono-label text-[0.68rem] font-semibold tracking-[0.2em] text-[var(--color-soft)]">
        {index}
      </span>
      <span className="h-px w-8 bg-[var(--border-card)]" />
      <span className={eyebrow}>{label}</span>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--color-page)] text-[var(--color-text)]">
      <div id="page-top" aria-hidden="true" className="absolute top-0" />
      <SiteNav />

      <section
        id="top"
        className="relative flex min-h-svh flex-col overflow-hidden pt-28 sm:pt-32"
      >
        <div
          className="halo -left-[10%] -top-[10%] h-[40rem] w-[40rem]"
          style={{ background: "var(--halo-a)" }}
        />
        <div
          className="halo -right-[8%] top-[20%] h-[32rem] w-[32rem]"
          style={{ background: "var(--halo-b)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-70"
          style={{
            backgroundImage:
              "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(120% 80% at 50% 0%, #000 30%, transparent 78%)",
          }}
        />

        <div className={`${shell} relative z-10 flex flex-1 flex-col justify-center`}>
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-card)] bg-[var(--color-field)] px-3 py-1.5 font-mono-label text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-text)]">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--color-accent-2)] opacity-70" />
                    <span className="relative inline-flex size-2 rounded-full bg-[var(--color-accent-2)]" />
                  </span>
                  Available for product builds
                </span>
              </Reveal>

              <Reveal delay={60}>
                <h1
                  className={`${display} mt-6 text-[clamp(2.1rem,5.6vw,4.3rem)]`}
                >
                  Products built
                  <br />
                  from{" "}
                  <span className="relative whitespace-nowrap text-[var(--color-accent)]">
                    idea
                    <svg
                      className="absolute -bottom-0.5 left-0 w-full"
                      viewBox="0 0 200 12"
                      fill="none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 8c40-6 158-6 196 0"
                        stroke="var(--color-accent)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>{" "}
                  to launch.
                </h1>
              </Reveal>

              <Reveal delay={120}>
                <p className="mt-7 max-w-[36rem] text-[1rem] leading-8 text-[var(--color-muted)] sm:text-[1.06rem]">
                  I&apos;m{" "}
                  <span className="font-bold text-[var(--color-text)]">
                    Mehfooz-ur-Rehman
                  </span>{" "}
                  — a full-stack product developer shipping web, mobile,
                  desktop, AI and automation systems that businesses rely on
                  every day.
                </p>
              </Reveal>

              <Reveal delay={180}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <a
                    href="#contact"
                    className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-[0.9rem] font-bold text-[var(--color-on-accent)] shadow-lg shadow-[color:var(--shadow-accent)] transition hover:shadow-xl"
                  >
                    Let&apos;s build
                    <ArrowRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </a>
                  <a
                    href="/cv.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--border-card)] bg-[var(--color-field)] px-5 text-[0.9rem] font-bold text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]"
                  >
                    Download CV
                    <ArrowUpRight size={17} aria-hidden="true" />
                  </a>
                  <a
                    href={profile.github}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[var(--border-card)] px-5 text-[0.9rem] font-bold text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]"
                  >
                    <Code2 size={17} aria-hidden="true" /> GitHub
                  </a>
                </div>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-11 grid max-w-[34rem] grid-cols-3 gap-4 border-t border-[var(--border-subtle)] pt-6">
                  {[
                    ["6+", "Years shipping"],
                    ["20+", "Products built"],
                    [profile.company, "Currently at"],
                  ].map(([value, label]) => (
                    <div key={label}>
                      <div className={`${display} text-[clamp(1.3rem,2.4vw,1.9rem)]`}>
                        {value}
                      </div>
                      <div className="mt-1 font-mono-label text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-soft)]">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            <Reveal delay={140} className="relative mx-auto w-full max-w-[28.5rem]">
              <div className="relative">
                <div className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-[var(--color-accent)]/25 to-[var(--color-accent-2)]/20 blur-2xl" />
                <div className="overflow-hidden rounded-[1.7rem] border border-[var(--border-card)] bg-[var(--color-raise)] shadow-[0_30px_80px_-40px_var(--shadow-strong)]">
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <Image
                      src="/pic.webp"
                      alt="Mehfooz-ur-Rehman"
                      fill
                      className="object-cover object-center"
                      sizes="(max-width: 1024px) 90vw, 420px"
                      priority
                    />
                    <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
                      <div>
                        <div className="font-mono-label text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/70">
                          {profile.role}
                        </div>
                        <div className="mt-0.5 text-[0.95rem] font-extrabold text-white">
                          Web · Mobile · AI
                        </div>
                      </div>
                      <a
                        href="#work"
                        aria-label="View work"
                        className="grid size-11 place-items-center rounded-full bg-white/95 text-[#17140f] transition hover:bg-[var(--color-accent)] hover:text-white"
                      >
                        <ArrowUpRight size={19} aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-4 top-8 hidden rounded-2xl border border-[var(--border-card)] bg-[var(--color-page-soft)]/90 px-3.5 py-2.5 shadow-lg shadow-[color:var(--shadow-ambient)] backdrop-blur-md sm:block">
                  <div className="font-mono-label text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-[var(--color-soft)]">
                    Stack
                  </div>
                  <div className="text-[0.82rem] font-bold text-[var(--color-text)]">
                    Next · Convex · AI
                  </div>
                </div>
                <div className="absolute -right-3 bottom-16 hidden items-center gap-2 rounded-2xl border border-[var(--border-card)] bg-[var(--color-page-soft)]/90 px-3.5 py-2.5 shadow-lg shadow-[color:var(--shadow-ambient)] backdrop-blur-md sm:flex">
                  <MapPin size={14} className="text-[var(--color-accent)]" aria-hidden="true" />
                  <span className="text-[0.78rem] font-bold text-[var(--color-text)]">
                    Faisalabad, PK
                  </span>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="mt-12 flex items-center gap-3 font-mono-label text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-soft)]">
            <ArrowDown size={14} className="animate-bounce" aria-hidden="true" />
            Scroll to explore
          </div>
        </div>

        <div className="marquee-wrap marquee-mask relative z-10 mt-12 overflow-hidden border-y border-[var(--border-subtle)] bg-[var(--color-page-soft)] py-4 sm:mt-16">
          <div className="marquee-track">
            {[...stack, ...stack].map((item, i) => (
              <span
                key={`${item}-${i}`}
                className="flex items-center gap-6 pr-6 font-mono-label text-[0.9rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted)]"
              >
                {item}
                <span className="text-[var(--color-accent)]">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className={`${shell} py-14 sm:py-20`}>
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <SectionMarker index="01" label="Profile" />
            <h2 className={`${display} text-[clamp(1.55rem,2.9vw,2.35rem)]`}>
              A product developer with real, practical range.
            </h2>
            <p className="mt-6 text-[0.98rem] leading-8 text-[var(--color-muted)]">
              {profile.about}
            </p>
            <p className="mt-4 text-[0.98rem] leading-8 text-[var(--color-muted)]">
              {profile.subheadline}
            </p>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2">
            {profileHighlights.map((item, i) => (
              <Reveal
                key={item.title}
                delay={i * 70}
                as="article"
                className="card-hover flex flex-col rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                  <item.icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-[1.05rem] font-extrabold leading-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-[0.9rem] leading-7 text-[var(--color-muted)]">
                  {item.text}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section
        id="services"
        className="border-y border-[var(--border-subtle)] bg-[var(--color-page-soft)]"
      >
        <div className={`${shell} py-14 sm:py-20`}>
          <Reveal>
            <SectionMarker index="02" label="What I build" />
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
              <h2 className={`${display} text-[clamp(1.55rem,2.9vw,2.35rem)]`}>
                Complete business systems, not isolated screens.
              </h2>
              <p className="text-[0.96rem] leading-8 text-[var(--color-muted)]">
                I build the workflows around the screen too: data, roles,
                automation, integrations and the launch details that make
                software actually usable.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 divide-y divide-[var(--border-subtle)] border-t border-[var(--border-subtle)]">
            {services.map((service, i) => (
              <Reveal
                key={service.title}
                as="article"
                className="group grid grid-cols-[auto_1fr] items-start gap-5 py-7 transition sm:grid-cols-[auto_0.4fr_1fr] sm:items-center sm:gap-8"
              >
                <span className="font-mono-label text-[0.72rem] font-semibold text-[var(--color-soft)]">
                  0{i + 1}
                </span>
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[var(--border-card)] bg-[var(--color-raise)] text-[var(--color-accent)] transition group-hover:border-[var(--border-hover)]">
                    <service.icon size={22} aria-hidden="true" />
                  </span>
                  <h3 className="text-[1.2rem] font-extrabold leading-tight transition group-hover:text-[var(--color-accent)]">
                    {service.title}
                  </h3>
                </div>
                <p className="col-span-2 text-[0.92rem] leading-7 text-[var(--color-muted)] sm:col-span-1">
                  {service.description}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="work" className={`${shell} py-14 sm:py-20`}>
        <Reveal>
          <SectionMarker index="03" label="Featured work" />
          <h2 className={`${display} max-w-2xl text-[clamp(1.55rem,2.9vw,2.35rem)]`}>
            Products shaped around operations, revenue and daily use.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, i) => {
            const logo = getProjectLogoSrc(project);
            const featured = i < 2;
            return (
              <Reveal
                key={project.slug}
                delay={(i % 3) * 60}
                as="article"
                className={`card-hover group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] ${
                  featured ? "md:col-span-1 xl:col-span-1" : ""
                }`}
              >
                {project.heroImageUrl ? (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--color-page-soft)]">
                    <Image
                      src={project.heroImageUrl}
                      alt={`${project.title} preview`}
                      fill
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition group-hover:opacity-100" />
                  </div>
                ) : (
                  <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--color-accent)]/12 to-[var(--color-accent-2)]/10">
                    <project.icon
                      size={44}
                      className="text-[var(--color-accent)] opacity-80"
                      aria-hidden="true"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center gap-2.5">
                    {logo ? (
                      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--color-page)]">
                        <Image
                          src={logo}
                          alt=""
                          width={24}
                          height={24}
                          className="size-5 object-contain"
                          aria-hidden="true"
                        />
                      </span>
                    ) : null}
                    <span className="font-mono-label text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-soft)]">
                      {project.category}
                    </span>
                  </div>

                  <h3 className="text-[1.25rem] font-extrabold leading-tight">
                    {project.title}
                  </h3>
                  <p className="mt-2.5 text-[0.88rem] leading-7 text-[var(--color-muted)]">
                    {project.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.stack.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-[var(--border-subtle)] bg-[var(--color-page)] px-2 py-1 font-mono-label text-[0.62rem] font-semibold tracking-[0.04em] text-[var(--color-muted)]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-6">
                    <Link
                      href={`/case-studies/${project.slug}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--border-card)] px-4 py-2.5 text-[0.78rem] font-bold text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]"
                    >
                      Case study
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                    {project.url ? (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Visit ${project.title}`}
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--color-inverse)] text-[var(--color-inverse-text)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)]"
                      >
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <GitHubCalendarSection />

      <section
        id="experience"
        className="border-y border-[var(--border-subtle)] bg-[var(--color-page-soft)]"
      >
        <div className={`${shell} py-14 sm:py-20`}>
          <Reveal>
            <SectionMarker index="04" label="Experience" />
            <h2 className={`${display} max-w-2xl text-[clamp(1.55rem,2.9vw,2.35rem)]`}>
              Work across schools, SaaS teams and business systems.
            </h2>
          </Reveal>

          <div className="mt-12 border-l border-[var(--border-card)] pl-6 sm:pl-8">
            {experience.map((item, i) => (
              <Reveal
                key={`${item.company}-${item.period}`}
                as="article"
                delay={i * 50}
                className="relative pb-10 last:pb-0"
              >
                <span className="absolute -left-[calc(1.5rem+5px)] top-1.5 grid size-2.5 place-items-center rounded-full bg-[var(--color-accent)] ring-4 ring-[var(--color-page-soft)] sm:-left-[calc(2rem+5px)]" />
                <div className="font-mono-label text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                  {item.period}
                </div>
                <h3 className="mt-2 text-[1.2rem] font-extrabold leading-tight">
                  {item.role}
                </h3>
                <p className="mt-1 text-[0.92rem] font-bold text-[var(--color-soft)]">
                  {item.company} · {item.location}
                </p>
                <p className="mt-3 max-w-2xl text-[0.92rem] leading-7 text-[var(--color-muted)]">
                  {item.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md border border-[var(--border-subtle)] bg-[var(--color-raise)] px-2.5 py-1 font-mono-label text-[0.64rem] font-semibold text-[var(--color-muted)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className={`${shell} py-14 sm:py-20`}>
        <Reveal>
          <SectionMarker index="05" label="How I work" />
          <h2 className={`${display} max-w-2xl text-[clamp(1.55rem,2.9vw,2.35rem)]`}>
            A direct path from workflow to working software.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {process.map((item, i) => (
            <Reveal
              key={item.title}
              delay={i * 70}
              as="article"
              className="card-hover relative overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6"
            >
              <span
                className={`${display} absolute -right-2 -top-3 text-[5rem] text-[var(--color-text)] opacity-[0.05]`}
              >
                {i + 1}
              </span>
              <span className="grid size-11 place-items-center rounded-xl bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                <item.icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-[1.1rem] font-extrabold leading-tight">
                {item.title}
              </h3>
              <p className="mt-2 text-[0.9rem] leading-7 text-[var(--color-muted)]">
                {item.text}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--border-subtle)] bg-[var(--color-page-soft)]">
        <div className={`${shell} grid gap-12 py-14 sm:py-20 lg:grid-cols-2 lg:gap-16`}>
          <Reveal>
            <SectionMarker index="06" label="Education" />
            {education.map((item) => (
              <article
                key={item.school}
                className="rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6"
              >
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--color-inverse)] text-[var(--color-inverse-text)]">
                    <GraduationCap size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-[1.12rem] font-extrabold leading-tight">
                      {item.school}
                    </h3>
                    <p className="mt-1 text-[0.9rem] text-[var(--color-muted)]">
                      {item.degree}
                    </p>
                    <p className="mt-2 font-mono-label text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-accent)]">
                      {item.period}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {item.focus.map((f) => (
                    <span
                      key={f}
                      className="rounded-md border border-[var(--border-subtle)] bg-[var(--color-page)] px-2.5 py-1 font-mono-label text-[0.64rem] font-semibold text-[var(--color-muted)]"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </Reveal>

          <Reveal delay={80}>
            <SectionMarker index="07" label="Toolkit" />
            <h3 className={`${display} text-[1.4rem]`}>
              Modern tools I already use to ship.
            </h3>
            <div className="mt-6 flex flex-wrap gap-2">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--border-card)] bg-[var(--color-raise)] px-3.5 py-2 font-mono-label text-[0.72rem] font-semibold text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className={`${shell} py-14 sm:py-20`}>
        <Reveal>
          <SectionMarker index="08" label="Testimonials" />
          <h2 className={`${display} max-w-2xl text-[clamp(1.55rem,2.9vw,2.35rem)]`}>
            What clients and teammates already say.
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal
              key={t.name}
              delay={i * 70}
              as="blockquote"
              className="card-hover flex flex-col rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6"
            >
              <span className={`${display} text-[3rem] leading-none text-[var(--color-accent)]/30`}>
                &ldquo;
              </span>
              <p className="-mt-3 text-[1.02rem] font-bold leading-8 text-[var(--color-text)]">
                {t.quote}
              </p>
              <footer className="mt-6 flex items-center gap-3 border-t border-[var(--border-subtle)] pt-5">
                <span className="grid size-10 place-items-center rounded-full bg-[var(--color-accent)]/12 font-extrabold text-[var(--color-accent)]">
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-[0.9rem] font-extrabold">
                    {t.name}
                  </span>
                  <span className="block text-[0.8rem] text-[var(--color-muted)]">
                    {t.role}
                  </span>
                </span>
              </footer>
            </Reveal>
          ))}
        </div>
      </section>

      <section
        id="contact"
        className="relative overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--color-page-soft)]"
      >
        <div
          className="halo -bottom-[20%] left-[10%] h-[30rem] w-[30rem]"
          style={{ background: "var(--halo-a)" }}
        />
        <div className={`${shell} relative z-10 grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16`}>
          <Reveal>
            <SectionMarker index="09" label="Start here" />
            <h2 className={`${display} text-[clamp(1.7rem,3.1vw,2.55rem)]`}>
              Need a reliable developer to build your product?
            </h2>
            <p className="mt-6 max-w-xl text-[0.98rem] leading-8 text-[var(--color-muted)]">
              Send the workflow, product idea or stuck project. I&apos;m
              strongest when the job needs product thinking, full-stack
              execution and a practical launch path.
            </p>

            <div className="mt-8 grid gap-2.5">
              {[
                {
                  icon: Mail,
                  label: profile.email,
                  href: `mailto:${profile.email}`,
                },
                {
                  icon: MessageCircle,
                  label: `WhatsApp · ${profile.phone}`,
                  href: profile.whatsapp,
                },
                {
                  icon: Phone,
                  label: profile.phone,
                  href: `tel:${profile.phone.replaceAll(" ", "")}`,
                },
              ].map((row) => (
                <a
                  key={row.label}
                  href={row.href}
                  className="card-hover flex items-center gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--color-raise)] px-4 py-3.5 text-[0.9rem] font-bold text-[var(--color-text)]"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
                    <row.icon size={16} aria-hidden="true" />
                  </span>
                  {row.label}
                  <ArrowUpRight
                    size={15}
                    className="ml-auto text-[var(--color-soft)]"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                ["LinkedIn", profile.linkedin],
                ["Instagram", profile.instagram],
                ["GitHub", profile.github],
                ["CodeSandbox", profile.codesandbox],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-card)] px-3.5 py-2 font-mono-label text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]"
                >
                  {label}
                  <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              ))}
            </div>
          </Reveal>

          <Reveal delay={80}>
            <ContactForm />
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-[var(--border-hairline)] bg-[var(--color-page)]">
        <div className={`${shell} py-8`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono-label text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-soft)]">
              Archive · earlier versions
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["v1", "https://mehfoozurrehmanv1.web.app/"],
                ["v2", "https://mehfoozurrehmanv2.web.app/"],
                ["v3", "https://mehfoozurrehmanv3.web.app/"],
                ["v4", "https://mehfoozurrehmanv4.web.app/"],
                ["v5", "https://mehfoozurrehmanv5.web.app/"],
                ["v6", "https://mehfoozurrehmanv6.web.app/"],
              ].map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] px-2.5 py-1 font-mono-label text-[0.66rem] font-semibold text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]"
                >
                  {label}
                  <ArrowUpRight size={12} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <p className="mt-5 border-t border-[var(--border-subtle)] pt-5 text-[0.72rem] text-[var(--color-muted)]">
            © 2026 Mehfoozur Rehman. Designed & built from scratch. All rights
            reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Code2, GraduationCap, Link as LinkIcon, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { ContactForm } from "./contact-form";
import { GitHubCalendarSection } from "./github-calendar";
import { HomeLink } from "./home-link";
import { ThemeToggle } from "./theme-toggle";
import { education, experience, process, profile, profileHighlights, projects, services, stack, testimonials } from "./data";

const sectionClass = "mx-auto max-w-[1360px] px-5 py-12 sm:px-8 lg:px-12 lg:py-18 xl:px-16";
const eyebrowClass = "mb-4 flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--color-accent)]";
const displayClass = "font-[family-name:var(--font-nunito)] font-extrabold leading-[0.98] tracking-normal";
const sectionHeadingClass = `${displayClass} text-[clamp(1.35rem,1.65vw,1.85rem)]`;
const cardClass = "rounded-[18px] border border-[var(--border-card)] transition duration-200 hover:border-[var(--border-hover)]";

function getProjectLogoSrc(project: { url?: string; logoUrl?: string }) {
  if (project.logoUrl) {
    return project.logoUrl;
  }

  if (!project.url) {
    return null;
  }

  try {
    return `https://www.google.com/s2/favicons?domain=${new URL(project.url).hostname}&sz=128`;
  } catch {
    return null;
  }
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[var(--color-page)] text-[var(--color-text)]">
      <div id="page-top" aria-hidden="true" />
      <nav className="mx-auto flex max-w-[1360px] items-center justify-between px-5 pt-5 sm:px-8 lg:px-12 xl:px-16">
        <HomeLink href="#page-top" />
        <div className="flex items-center gap-0 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[var(--color-muted)] sm:gap-2 sm:text-[0.72rem]">
          <a className="rounded-full px-2.5 py-2 transition hover:bg-[var(--color-field)] hover:text-[var(--color-text)] sm:px-3" href="#work">
            Work
          </a>
          <a className="hidden rounded-full px-2.5 py-2 transition hover:bg-[var(--color-field)] hover:text-[var(--color-text)] sm:inline-flex sm:px-3" href="#about">
            About
          </a>
          <a className="hidden rounded-full px-2.5 py-2 transition hover:bg-[var(--color-field)] hover:text-[var(--color-text)] md:inline-flex sm:px-3" href="#experience">
            Experience
          </a>
          <a className="rounded-full px-2.5 py-2 transition hover:bg-[var(--color-field)] hover:text-[var(--color-text)] sm:px-3" href="#services">
            Services
          </a>
          <a className="rounded-full bg-[var(--color-inverse)] px-3 py-2 text-[var(--color-inverse-text)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)] sm:px-4" href="#contact">
            Contact
          </a>
          <ThemeToggle />
        </div>
      </nav>

      <section id="top" className="mx-auto grid max-w-[1360px] gap-10 px-5 pb-12 pt-10 sm:px-8 lg:min-h-[760px] lg:grid-cols-[0.98fr_1.02fr] lg:items-start lg:px-12 lg:pb-14 lg:pt-20 xl:px-16">
        <div className="max-w-[600px]">
          <p className={eyebrowClass}>
            <Sparkles size={14} aria-hidden="true" />
            Available for product builds
          </p>
          <h1 className={`${displayClass} text-[clamp(2rem,3.9vw,3.65rem)]`}>
            Building products from idea to launch.
          </h1>
          <h2 className="mt-5 max-w-[500px] text-[clamp(0.92rem,1.22vw,1.18rem)] font-extrabold leading-[1.22] tracking-normal">
            I&apos;m Mehfooz-ur-Rehman, a full-stack developer for web, mobile, desktop, AI and automation systems.
          </h2>
          <p className="mt-5 max-w-[500px] text-[0.9rem] leading-7 text-[var(--color-muted)] sm:text-[0.95rem]">
            {profile.about}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-accent)] px-5 text-[0.82rem] font-black text-[var(--color-on-accent)] shadow-lg shadow-[color:var(--shadow-accent)] sm:min-h-11 sm:px-6 sm:text-sm" href="#contact">
              Let&apos;s build <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border-card)] px-4 text-[0.82rem] font-black text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)] sm:min-h-11 sm:px-5 sm:text-sm" href="/cv.pdf" target="_blank" rel="noreferrer">
              CV <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border-card)] px-4 text-[0.82rem] font-black text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)] sm:min-h-11 sm:px-5 sm:text-sm" href={profile.github} target="_blank" rel="noreferrer">
              <Code2 size={18} aria-hidden="true" /> GitHub
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-4 border-t border-[var(--border-subtle)] pt-6">
            {[
              ["6+", "Years"],
              [profile.company, "Current"]
            ].map(([value, label]) => (
              <div key={value}>
                <strong className={`${displayClass} block text-[1.55rem]`}>{value}</strong>
                <span className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--color-soft)]">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 hidden max-w-[500px] items-center gap-5 border-t border-[var(--border-subtle)] pt-5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--color-muted)] sm:flex">
            <span>Follow</span>
            <a className="hover:text-[var(--color-accent)]" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="hover:text-[var(--color-accent)]" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
            <a className="hover:text-[var(--color-accent)]" href={profile.instagram} target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[520px] justify-self-center lg:mt-2 lg:justify-self-end">
          <div className="absolute -left-7 top-10 z-10 hidden rounded-full bg-[var(--color-page-soft)] px-6 py-4 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[var(--color-text)] shadow-xl shadow-[color:var(--shadow-strong)] sm:block">
            Next.js / Firebase / AI
          </div>
          <div className="absolute -right-4 bottom-24 z-10 hidden size-[8.5rem] place-items-center rounded-full bg-[var(--color-accent)] p-5 text-center text-[var(--color-on-accent)] shadow-xl shadow-[color:var(--shadow-accent)] sm:grid">
            <strong className="text-[1.05rem] font-extrabold leading-tight">Complete products, not just screens.</strong>
          </div>
          <div className="absolute -bottom-6 left-8 hidden h-16 w-[82%] rounded-full bg-[var(--border-subtle)] blur-2xl lg:block" />
          <div className="relative overflow-hidden rounded-[28px] border-[10px] border-[var(--color-inverse)] bg-[var(--color-inverse)] shadow-2xl shadow-[color:var(--shadow-strong)] sm:rounded-[32px] sm:border-[14px]">
            <div className="relative aspect-[1.08] overflow-hidden rounded-[18px] bg-[var(--color-soft)] sm:aspect-[0.96] sm:rounded-[20px]">
              <Image className="h-full w-full object-cover object-center" src="/pic.webp" alt="Mehfooz-ur-Rehman" width={720} height={840} priority />
            </div>
            <div className="grid gap-3 border-t-[10px] border-[var(--color-inverse)] bg-[var(--color-page)] p-4 text-[var(--color-text)] sm:grid-cols-[1fr_auto] sm:items-center sm:border-t-[14px]">
              <div>
                <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[var(--color-accent)]">{profile.role}</span>
                <strong className="mt-1 block text-[0.95rem] leading-tight sm:text-[1rem]">Web, mobile, desktop, AI and automation.</strong>
              </div>
              <a className="inline-flex size-11 items-center justify-center rounded-full bg-[var(--color-inverse)] text-[var(--color-inverse-text)]" href="#work" aria-label="View work">
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 border-y border-[var(--border-subtle)] text-[0.68rem] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
            <span className="py-3">Product</span>
            <span className="border-x border-[var(--border-subtle)] px-3 py-3 text-center">Systems</span>
            <span className="py-3 text-right">Launch</span>
          </div>
        </div>
      </section>

      <section id="about" className={`${sectionClass} grid gap-10 border-t border-[var(--border-subtle)] lg:grid-cols-[0.78fr_1.22fr]`}>
        <div className="min-w-0">
          <p className={eyebrowClass}>Profile</p>
          <h2 className={sectionHeadingClass}>A product developer with practical range.</h2>
          <p className="mt-5 text-[0.92rem] leading-8 text-[var(--color-muted)]">{profile.subheadline}</p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {profileHighlights.map((item) => (
            <article className={`${cardClass} min-w-0 p-5`} key={item.title}>
              <item.icon className="mb-5 text-[var(--color-accent)]" size={24} aria-hidden="true" />
              <h3 className="mb-2 text-[1.08rem] font-extrabold leading-tight">{item.title}</h3>
              <p className="text-[0.9rem] leading-7 text-[var(--color-muted)]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="experience" className={`${sectionClass} border-t border-[var(--border-subtle)]`}>
        <div className="mb-9 max-w-3xl">
          <p className={eyebrowClass}>Experience</p>
          <h2 className={sectionHeadingClass}>Product work across schools, SaaS teams and business systems.</h2>
        </div>
        <div className="grid gap-3">
          {experience.map((item) => (
            <article className={`${cardClass} grid gap-5 p-5 lg:grid-cols-[0.38fr_1fr]`} key={`${item.company}-${item.period}`}>
              <div>
                <p className="text-[0.74rem] font-black uppercase tracking-[0.14em] text-[var(--color-accent)]">{item.period}</p>
                <p className="mt-2 text-[0.86rem] font-bold leading-6 text-[var(--color-muted)]">{item.location}</p>
              </div>
              <div>
                <h3 className="text-[1.25rem] font-extrabold leading-tight">{item.role}</h3>
                <p className="mt-1 text-[0.92rem] font-extrabold text-[var(--color-soft)]">{item.company}</p>
                <p className="mt-4 max-w-3xl text-[0.92rem] leading-8 text-[var(--color-muted)]">{item.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.skills.map((skill) => (
                    <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[0.7rem] font-black text-[var(--color-text)] transition hover:border-[var(--border-hover)]" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="services" className={`${sectionClass} grid gap-10 border-t border-[var(--border-subtle)] lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>What I build</p>
          <h2 className={sectionHeadingClass}>Complete business systems, not isolated screens.</h2>
          <p className="mt-5 text-[0.92rem] leading-8 text-[var(--color-muted)]">
            I build the workflows around the screen too: data, roles, automation, integrations and launch details.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <article className={`${cardClass} p-5`} key={service.title}>
              <service.icon className="mb-4 text-[var(--color-accent)]" size={24} aria-hidden="true" />
              <h3 className="mb-2 text-[1.12rem] font-extrabold leading-tight">{service.title}</h3>
              <p className="text-[0.9rem] leading-7 text-[var(--color-muted)]">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className={sectionClass}>
        <div className="mb-9 max-w-3xl">
          <p className={eyebrowClass}>Featured work</p>
          <h2 className={sectionHeadingClass}>Products shaped around operations, revenue and daily use.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article className={`${cardClass} flex min-h-[330px] flex-col p-5`} key={project.title}>
              <div className="mb-5 flex items-start justify-between gap-4">
                {getProjectLogoSrc(project) ? (
                  <div className="grid size-10 place-items-center overflow-hidden rounded-full border border-[var(--border-subtle)] bg-[var(--color-page)]">
                    <Image className={`object-contain ${project.logoUrl ? "size-8" : "size-7"}`} src={getProjectLogoSrc(project) ?? "/favicon.svg"} alt="" width={32} height={32} aria-hidden="true" />
                  </div>
                ) : (
                  <div className="grid size-10 place-items-center rounded-full bg-[var(--color-inverse)] text-[var(--color-inverse-text)]">
                    <project.icon size={20} aria-hidden="true" />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[0.72rem] font-black text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]" href={`/case-studies/${project.slug}`}>
                    Case study <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                  {project.url ? (
                    <a className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[0.72rem] font-black text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]" href={project.url} target="_blank" rel="noreferrer">
                      Visit <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
              <p className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[var(--color-soft)]">{project.category}</p>
              <h3 className="mb-3 text-[1.28rem] font-extrabold leading-tight">{project.title}</h3>
              <p className="text-[0.9rem] leading-7 text-[var(--color-muted)]">{project.summary}</p>
              <strong className="mt-5 block border-t border-[var(--border-subtle)] pt-4 text-[0.94rem] leading-7 text-[var(--color-text)]">{project.businessValue}</strong>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {project.stack.map((item) => (
                  <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[0.7rem] font-black text-[var(--color-text)] transition hover:border-[var(--border-hover)]" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <GitHubCalendarSection />

      <section className={`${sectionClass} grid gap-6 border-y border-[var(--border-subtle)] lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>Education</p>
          <h2 className={sectionHeadingClass}>Computer science foundation with product experience on top.</h2>
        </div>
        <div className="grid gap-3">
          {education.map((item) => (
            <article className={`${cardClass} grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:items-start`} key={item.school}>
              <div className="grid size-11 place-items-center rounded-full bg-[var(--color-inverse)] text-[var(--color-inverse-text)]">
                <GraduationCap size={22} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-[1.16rem] font-extrabold leading-tight">{item.school}</h3>
                <p className="mt-1 text-[0.92rem] font-medium text-[var(--color-muted)]">{item.degree}</p>
                <p className="mt-2 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[var(--color-accent)]">{item.period}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.focus.map((focus) => (
                    <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-[0.7rem] font-black transition hover:border-[var(--border-hover)]" key={focus}>
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} grid gap-10 border-y border-[var(--border-subtle)] lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>Stack</p>
          <h2 className={sectionHeadingClass}>Modern tools I already use to ship.</h2>
        </div>
        <div className="flex content-start flex-wrap gap-2">
          {stack.map((item) => (
            <span className="rounded-full border border-[var(--border-subtle)] px-3.5 py-2 text-[0.76rem] font-black text-[var(--color-text)] transition hover:border-[var(--border-hover)]" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} grid gap-3 md:grid-cols-3`}>
        {process.map((item) => (
          <article className={`${cardClass} p-5`} key={item.title}>
            <item.icon className="mb-5 text-[var(--color-accent)]" size={24} aria-hidden="true" />
            <h3 className="mb-3 text-[1.12rem] font-extrabold leading-tight">{item.title}</h3>
            <p className="text-[0.9rem] leading-7 text-[var(--color-muted)]">{item.text}</p>
          </article>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="mb-9 max-w-3xl">
          <p className={eyebrowClass}>Testimonials</p>
          <h2 className={sectionHeadingClass}>What clients and teammates already say.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote className={`${cardClass} p-5`} key={testimonial.name}>
              <p className={`${displayClass} text-[1.14rem] leading-tight`}>&ldquo;{testimonial.quote}&rdquo;</p>
              <footer className="mt-7 grid gap-1">
                <strong>{testimonial.name}</strong>
                <span className="text-[var(--color-muted)]">{testimonial.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="contact" className="border-t border-[var(--border-subtle)] bg-[var(--color-page)] text-[var(--color-text)]">
        <div className={`${sectionClass} grid gap-10 lg:grid-cols-[0.9fr_1.1fr]`}>
          <div>
            <p className={eyebrowClass}>Start here</p>
            <h2 className={sectionHeadingClass}>Need a reliable developer to build your product?</h2>
            <p className="mt-6 max-w-xl text-[0.9rem] leading-7 text-[var(--color-muted)] sm:text-[0.95rem] sm:leading-8">
              Send the workflow, product idea or stuck project. I am strongest when the job needs product thinking,
              full-stack execution and a practical launch path.
            </p>
            <div className={`${cardClass} mt-8 grid max-w-xl overflow-hidden text-[0.85rem] font-bold text-[var(--color-text)] sm:text-[0.9rem]`}>
              <a className="inline-flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-3 transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]" href={`mailto:${profile.email}`}>
                <Mail size={18} aria-hidden="true" /> {profile.email}
              </a>
              <a className="inline-flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-3 transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]" href={profile.whatsapp}>
                <MessageCircle size={18} aria-hidden="true" /> WhatsApp {profile.phone}
              </a>
              <a className="inline-flex items-center gap-3 px-5 py-3 transition hover:text-[var(--color-accent)]" href={`tel:${profile.phone.replaceAll(" ", "")}`}>
                <Phone size={18} aria-hidden="true" /> {profile.phone}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                ["LinkedIn", profile.linkedin],
                ["Instagram", profile.instagram],
                ["GitHub", profile.github],
                ["CodeSandbox", profile.codesandbox]
              ].map(([label, href]) => (
                <a className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3.5 text-[0.76rem] font-black transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)] sm:px-4 sm:text-[0.8rem]" href={href} target="_blank" rel="noreferrer" key={label}>
                  <LinkIcon size={16} aria-hidden="true" /> {label}
                </a>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      <footer className="border-t border-[var(--border-hairline)] bg-[var(--color-page-soft)] text-[var(--color-text)]">
        <div className={`${sectionClass} !py-3`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.76rem] font-medium leading-6 text-[var(--color-muted)]">
              Archive of earlier portfolio versions.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["v1", "https://mehfoozurrehmanv1.web.app/"],
                ["v2", "https://mehfoozurrehmanv2.web.app/"],
                ["v3", "https://mehfoozurrehmanv3.web.app/"],
                ["v4", "https://mehfoozurrehmanv4.web.app/"],
                ["v5", "https://mehfoozurrehmanv5.web.app/"],
                ["v6", "https://mehfoozurrehmanv6.web.app/"]
              ].map(([label, href]) => (
                <a
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[0.72rem] font-black text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]"
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  key={label}
                >
                  <span>{label}</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>
          <p className="mt-3 border-t border-[var(--border-subtle)] pt-2 text-[0.68rem] leading-5 text-[var(--color-muted)]">
            Copyright {new Date().getFullYear()} Mehfoozur Rehman. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

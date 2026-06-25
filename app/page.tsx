import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Code2, GraduationCap, Link as LinkIcon, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { ContactForm } from "./contact-form";
import { HomeLink } from "./home-link";
import { education, experience, process, profile, profileHighlights, projects, services, stack, testimonials } from "./data";

const sectionClass = "mx-auto max-w-[1360px] px-5 py-12 sm:px-8 lg:px-12 lg:py-18 xl:px-16";
const eyebrowClass = "mb-4 flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#D7720C]";
const displayClass = "font-[family-name:var(--font-nunito)] font-extrabold leading-[0.98] tracking-normal";
const cardClass = "rounded-[18px] border border-[#0C2120]/15 transition duration-200 hover:border-[#D7720C]/45";

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
    <main className="min-h-screen overflow-x-hidden bg-[#F1EFE5] text-[#0C2120]">
      <div id="page-top" aria-hidden="true" />
      <nav className="mx-auto flex max-w-[1360px] items-center justify-between px-5 pt-5 sm:px-8 lg:px-12 xl:px-16">
        <HomeLink href="#page-top" />
        <div className="flex items-center gap-0 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#50463F] sm:gap-2 sm:text-[0.72rem]">
          <a className="rounded-full px-2.5 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120] sm:px-3" href="#work">
            Work
          </a>
          <a className="hidden rounded-full px-2.5 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120] sm:inline-flex sm:px-3" href="#about">
            About
          </a>
          <a className="hidden rounded-full px-2.5 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120] md:inline-flex sm:px-3" href="#experience">
            Experience
          </a>
          <a className="rounded-full px-2.5 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120] sm:px-3" href="#services">
            Services
          </a>
          <a className="rounded-full bg-[#0C2120] px-3 py-2 text-[#F1EFE5] hover:bg-[#D7720C] sm:px-4" href="#contact">
            Contact
          </a>
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
          <p className="mt-5 max-w-[500px] text-[0.9rem] leading-7 text-[#50463F] sm:text-[0.95rem]">
            {profile.about}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#D7720C] px-5 text-[0.82rem] font-black text-white shadow-lg shadow-[#D7720C]/20 sm:min-h-11 sm:px-6 sm:text-sm" href="#contact">
              Let&apos;s build <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#0C2120]/15 px-4 text-[0.82rem] font-black text-[#0C2120] transition hover:border-[#D7720C]/50 hover:text-[#D7720C] sm:min-h-11 sm:px-5 sm:text-sm" href={profile.github} target="_blank" rel="noreferrer">
              <Code2 size={18} aria-hidden="true" /> GitHub
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-4 border-t border-[#0C2120]/10 pt-6">
            {[
              ["6+", "Years"],
              [profile.company, "Current"]
            ].map(([value, label]) => (
              <div key={value}>
                <strong className={`${displayClass} block text-[1.55rem]`}>{value}</strong>
                <span className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#668A85]">{label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 hidden max-w-[500px] items-center gap-5 border-t border-[#0C2120]/10 pt-5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#50463F] sm:flex">
            <span>Follow</span>
            <a className="hover:text-[#D7720C]" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="hover:text-[#D7720C]" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
            <a className="hover:text-[#D7720C]" href={profile.instagram} target="_blank" rel="noreferrer">Instagram</a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[520px] justify-self-center lg:mt-2 lg:justify-self-end">
          <div className="absolute -left-7 top-10 z-10 hidden rounded-full bg-[#BCBDAC] px-6 py-4 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[#0C2120] shadow-xl shadow-[#0C2120]/10 sm:block">
            Next.js / Convex / AI
          </div>
          <div className="absolute -right-4 bottom-24 z-10 hidden size-[8.5rem] place-items-center rounded-full bg-[#D7720C] p-5 text-center text-white shadow-xl shadow-[#D7720C]/20 sm:grid">
            <strong className="text-[1.05rem] font-extrabold leading-tight">Complete products, not just screens.</strong>
          </div>
          <div className="absolute -bottom-6 left-8 hidden h-16 w-[82%] rounded-full bg-[#0C2120]/10 blur-2xl lg:block" />
          <div className="relative overflow-hidden rounded-[28px] border-[10px] border-[#0C2120] bg-[#0C2120] shadow-2xl shadow-[#0C2120]/20 sm:rounded-[32px] sm:border-[14px]">
            <div className="relative aspect-[1.08] overflow-hidden rounded-[18px] bg-[#668A85] sm:aspect-[0.96] sm:rounded-[20px]">
              <Image className="h-full w-full object-cover object-center" src="/pic.webp" alt="Mehfooz-ur-Rehman" width={720} height={840} priority />
            </div>
            <div className="grid gap-3 border-t-[10px] border-[#0C2120] bg-[#F1EFE5] p-4 text-[#0C2120] sm:grid-cols-[1fr_auto] sm:items-center sm:border-t-[14px]">
              <div>
                <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#D7720C]">{profile.role}</span>
                <strong className="mt-1 block text-[0.95rem] leading-tight sm:text-[1rem]">Web, mobile, desktop, AI and automation.</strong>
              </div>
              <a className="inline-flex size-11 items-center justify-center rounded-full bg-[#0C2120] text-[#F1EFE5]" href="#work" aria-label="View work">
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 border-y border-[#0C2120]/10 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#50463F]">
            <span className="py-3">Product</span>
            <span className="border-x border-[#0C2120]/10 px-3 py-3 text-center">Systems</span>
            <span className="py-3 text-right">Launch</span>
          </div>
        </div>
      </section>

      <section id="about" className={`${sectionClass} grid gap-10 border-t border-[#0C2120]/10 lg:grid-cols-[0.78fr_1.22fr]`}>
        <div className="min-w-0">
          <p className={eyebrowClass}>Profile</p>
          <h2 className={`${displayClass} text-[clamp(1.65rem,2.4vw,2.65rem)]`}>A product developer with practical range.</h2>
          <p className="mt-5 text-[0.92rem] leading-8 text-[#50463F]">{profile.subheadline}</p>
        </div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {profileHighlights.map((item) => (
            <article className={`${cardClass} min-w-0 p-5`} key={item.title}>
              <item.icon className="mb-5 text-[#D7720C]" size={24} aria-hidden="true" />
              <h3 className="mb-2 text-[1.08rem] font-extrabold leading-tight">{item.title}</h3>
              <p className="text-[0.9rem] leading-7 text-[#50463F]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="experience" className={`${sectionClass} border-t border-[#0C2120]/10`}>
        <div className="mb-9 max-w-3xl">
          <p className={eyebrowClass}>Experience</p>
          <h2 className={`${displayClass} text-[clamp(1.65rem,2.4vw,2.65rem)]`}>Product work across schools, SaaS teams and business systems.</h2>
        </div>
        <div className="grid gap-3">
          {experience.map((item) => (
            <article className={`${cardClass} grid gap-5 p-5 lg:grid-cols-[0.38fr_1fr]`} key={`${item.company}-${item.period}`}>
              <div>
                <p className="text-[0.74rem] font-black uppercase tracking-[0.14em] text-[#D7720C]">{item.period}</p>
                <p className="mt-2 text-[0.86rem] font-bold leading-6 text-[#50463F]">{item.location}</p>
              </div>
              <div>
                <h3 className="text-[1.25rem] font-extrabold leading-tight">{item.role}</h3>
                <p className="mt-1 text-[0.92rem] font-extrabold text-[#668A85]">{item.company}</p>
                <p className="mt-4 max-w-3xl text-[0.92rem] leading-8 text-[#50463F]">{item.summary}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.skills.map((skill) => (
                    <span className="rounded-full border border-[#0C2120]/10 px-3 py-1.5 text-[0.7rem] font-black text-[#0C2120] transition hover:border-[#D7720C]/40" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="services" className={`${sectionClass} grid gap-10 border-t border-[#0C2120]/10 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>What I build</p>
          <h2 className={`${displayClass} text-[clamp(1.65rem,2.4vw,2.65rem)]`}>Complete business systems, not isolated screens.</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <article className={`${cardClass} p-5`} key={service.title}>
              <service.icon className="mb-4 text-[#D7720C]" size={24} aria-hidden="true" />
              <h3 className="mb-2 text-[1.12rem] font-extrabold leading-tight">{service.title}</h3>
              <p className="text-[0.9rem] leading-7 text-[#50463F]">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className={sectionClass}>
        <div className="mb-9 max-w-3xl">
          <p className={eyebrowClass}>Featured work</p>
          <h2 className={`${displayClass} text-[clamp(1.65rem,2.4vw,2.65rem)]`}>Products shaped around operations, revenue and daily use.</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article className={`${cardClass} flex min-h-[330px] flex-col p-5`} key={project.title}>
              <div className="mb-5 flex items-start justify-between gap-4">
                {getProjectLogoSrc(project) ? (
                  <div className="grid size-10 place-items-center overflow-hidden rounded-full border border-[#0C2120]/10 bg-[#F1EFE5]">
                    <Image className={`object-contain ${project.logoUrl ? "size-8" : "size-7"}`} src={getProjectLogoSrc(project) ?? "/favicon.svg"} alt="" width={32} height={32} aria-hidden="true" />
                  </div>
                ) : (
                  <div className="grid size-10 place-items-center rounded-full bg-[#0C2120] text-[#F1EFE5]">
                    <project.icon size={20} aria-hidden="true" />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link className="inline-flex items-center gap-2 rounded-full border border-[#0C2120]/10 px-3 py-1.5 text-[0.72rem] font-black text-[#0C2120] transition hover:border-[#D7720C]/60 hover:text-[#D7720C]" href={`/case-studies/${project.slug}`}>
                    Case study <ArrowUpRight size={14} aria-hidden="true" />
                  </Link>
                  {project.url ? (
                    <a className="inline-flex items-center gap-2 rounded-full border border-[#0C2120]/10 px-3 py-1.5 text-[0.72rem] font-black text-[#0C2120] transition hover:border-[#D7720C]/60 hover:text-[#D7720C]" href={project.url} target="_blank" rel="noreferrer">
                      Visit <ArrowUpRight size={14} aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </div>
              <p className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#668A85]">{project.category}</p>
              <h3 className="mb-3 text-[1.28rem] font-extrabold leading-tight">{project.title}</h3>
              <p className="text-[0.9rem] leading-7 text-[#50463F]">{project.summary}</p>
              <strong className="mt-5 block border-t border-[#0C2120]/10 pt-4 text-[0.94rem] leading-7 text-[#0C2120]">{project.businessValue}</strong>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {project.stack.map((item) => (
                  <span className="rounded-full border border-[#0C2120]/10 px-3 py-1.5 text-[0.7rem] font-black text-[#0C2120] transition hover:border-[#D7720C]/40" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} grid gap-6 border-y border-[#0C2120]/10 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>Education</p>
          <h2 className={`${displayClass} text-[clamp(1.65rem,2.4vw,2.65rem)]`}>Computer science foundation with product experience on top.</h2>
        </div>
        <div className="grid gap-3">
          {education.map((item) => (
            <article className={`${cardClass} grid gap-4 p-5 sm:grid-cols-[auto_1fr] sm:items-start`} key={item.school}>
              <div className="grid size-11 place-items-center rounded-full bg-[#0C2120] text-[#F1EFE5]">
                <GraduationCap size={22} aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-[1.16rem] font-extrabold leading-tight">{item.school}</h3>
                <p className="mt-1 text-[0.92rem] font-medium text-[#50463F]">{item.degree}</p>
                <p className="mt-2 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#D7720C]">{item.period}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.focus.map((focus) => (
                    <span className="rounded-full border border-[#0C2120]/10 px-3 py-1.5 text-[0.7rem] font-black transition hover:border-[#D7720C]/40" key={focus}>
                      {focus}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} grid gap-10 border-y border-[#0C2120]/10 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>Stack</p>
          <h2 className={`${displayClass} text-[clamp(1.65rem,2.4vw,2.65rem)]`}>Modern tools I already use to ship.</h2>
        </div>
        <div className="flex content-start flex-wrap gap-2">
          {stack.map((item) => (
            <span className="rounded-full border border-[#0C2120]/10 px-3.5 py-2 text-[0.76rem] font-black text-[#0C2120] transition hover:border-[#D7720C]/40" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} grid gap-3 md:grid-cols-3`}>
        {process.map((item) => (
          <article className={`${cardClass} p-5`} key={item.title}>
            <item.icon className="mb-5 text-[#D7720C]" size={24} aria-hidden="true" />
            <h3 className="mb-3 text-[1.12rem] font-extrabold leading-tight">{item.title}</h3>
            <p className="text-[0.9rem] leading-7 text-[#50463F]">{item.text}</p>
          </article>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="mb-9 max-w-3xl">
          <p className={eyebrowClass}>Testimonials</p>
          <h2 className={`${displayClass} text-[clamp(1.65rem,2.4vw,2.65rem)]`}>What clients and teammates already say.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote className={`${cardClass} p-5`} key={testimonial.name}>
              <p className={`${displayClass} text-[1.14rem] leading-tight`}>&ldquo;{testimonial.quote}&rdquo;</p>
              <footer className="mt-7 grid gap-1">
                <strong>{testimonial.name}</strong>
                <span className="text-[#50463F]">{testimonial.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="contact" className="border-t border-[#0C2120]/10 bg-[#F1EFE5] text-[#0C2120]">
        <div className={`${sectionClass} grid gap-10 lg:grid-cols-[0.9fr_1.1fr]`}>
          <div>
            <p className={eyebrowClass}>Start here</p>
            <h2 className={`${displayClass} text-[clamp(1.65rem,2.4vw,2.65rem)]`}>Need a reliable developer to build your product?</h2>
            <p className="mt-6 max-w-xl text-[0.9rem] leading-7 text-[#50463F] sm:text-[0.95rem] sm:leading-8">
              Send the workflow, product idea or stuck project. I am strongest when the job needs product thinking,
              full-stack execution and a practical launch path.
            </p>
            <div className={`${cardClass} mt-8 grid max-w-xl overflow-hidden text-[0.85rem] font-bold text-[#0C2120] sm:text-[0.9rem]`}>
              <a className="inline-flex items-center gap-3 border-b border-[#0C2120]/10 px-5 py-3 transition hover:border-[#D7720C]/35 hover:text-[#D7720C]" href={`mailto:${profile.email}`}>
                <Mail size={18} aria-hidden="true" /> {profile.email}
              </a>
              <a className="inline-flex items-center gap-3 border-b border-[#0C2120]/10 px-5 py-3 transition hover:border-[#D7720C]/35 hover:text-[#D7720C]" href={profile.whatsapp}>
                <MessageCircle size={18} aria-hidden="true" /> WhatsApp {profile.phone}
              </a>
              <a className="inline-flex items-center gap-3 px-5 py-3 transition hover:text-[#D7720C]" href={`tel:${profile.phone.replaceAll(" ", "")}`}>
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
                <a className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#0C2120]/10 px-3.5 text-[0.76rem] font-black transition hover:border-[#D7720C]/50 hover:text-[#D7720C] sm:px-4 sm:text-[0.8rem]" href={href} target="_blank" rel="noreferrer" key={label}>
                  <LinkIcon size={16} aria-hidden="true" /> {label}
                </a>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      <footer className="border-t border-[#0C2120]/8 bg-[#F7F2E7] text-[#0C2120]">
        <div className={`${sectionClass} !py-3`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.76rem] font-medium leading-6 text-[#5F564B]">
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
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#0C2120]/10 px-2.5 py-1 text-[0.72rem] font-black text-[#0C2120] transition hover:border-[#D7720C] hover:text-[#D7720C]"
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
          <p className="mt-3 border-t border-[#0C2120]/10 pt-2 text-[0.68rem] leading-5 text-[#7B7267]">
            Copyright {new Date().getFullYear()} Mehfoozur Rehman. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

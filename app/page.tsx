import Image from "next/image";
import { ArrowUpRight, Code2, Link, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { ContactForm } from "./contact-form";
import { process, profile, projects, services, stack, testimonials } from "./data";

const sectionClass = "mx-auto max-w-[1920px] px-5 py-12 sm:px-8 lg:px-16 xl:px-24 2xl:px-32 lg:py-16";
const eyebrowClass = "mb-4 flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#D7720C]";
const displayClass = "font-[family-name:var(--font-nunito)] font-black leading-[0.98] tracking-normal";
const cardClass = "rounded-[18px] border border-[#0C2120]/10 bg-[#F8F2E6]";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F1EFE5] text-[#0C2120]">
      <nav className="mx-auto flex max-w-[1920px] items-center justify-between px-5 pt-5 sm:px-8 lg:px-16 xl:px-24 2xl:px-32">
        <a className="grid size-11 place-items-center rounded-full bg-[#0C2120] text-[0.8rem] font-black text-[#F1EFE5]" href="#top">
          MR
        </a>
        <div className="flex items-center gap-1 text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-[#50463F] sm:gap-3">
          <a className="rounded-full px-3 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120]" href="#work">
            Work
          </a>
          <a className="rounded-full px-3 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120]" href="#services">
            Services
          </a>
          <a className="rounded-full px-3 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120]" href="#contact">
            Contact
          </a>
        </div>
      </nav>

      <section id="top" className="mx-auto grid max-w-[1920px] gap-8 px-5 pb-10 pt-9 sm:px-8 lg:min-h-[calc(100vh-68px)] lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:px-16 lg:pb-12 lg:pt-20 xl:px-24 2xl:px-32">
        <div className="max-w-[760px]">
          <p className={eyebrowClass}>
            <Sparkles size={14} aria-hidden="true" />
            Available for product builds
          </p>
          <h1 className={`${displayClass} text-[clamp(2.8rem,4.6vw,5rem)]`}>
            Mehfooz-ur-Rehman
          </h1>
          <h2 className="mt-5 max-w-[620px] text-[clamp(1.35rem,2.1vw,2.35rem)] font-black leading-[1.08] tracking-normal">
            Full-stack product developer building web, mobile, desktop and AI systems.
          </h2>
          <p className="mt-5 max-w-[560px] text-[0.98rem] leading-7 text-[#50463F] sm:text-[1.05rem]">
            I turn messy operations into fast, reliable software: dashboards, apps, automation, AI assistants and complete SaaS products.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#D7720C] px-6 text-sm font-black text-white shadow-lg shadow-[#D7720C]/20" href="#contact">
              Let&apos;s build <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#0C2120]/15 px-6 text-sm font-black text-[#0C2120]" href={profile.github} target="_blank" rel="noreferrer">
              <Code2 size={18} aria-hidden="true" /> GitHub
            </a>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              ["6+", "years"],
              ["100", "repos"],
              [profile.company, "currently"]
            ].map(([value, label]) => (
              <div className="rounded-[18px] border border-[#0C2120]/10 bg-[#F8F2E6] px-5 py-4" key={value}>
                <strong className={`${displayClass} block text-[1.9rem]`}>{value}</strong>
                <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#668A85]">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-[470px] 2xl:max-w-[520px]">
          <div className="absolute -left-4 top-8 hidden rounded-[22px] bg-[#BCBDAC] px-5 py-4 text-sm font-black text-[#0C2120] shadow-xl shadow-[#0C2120]/10 sm:block">
            Next.js / Convex / AI
          </div>
          <div className="absolute -right-3 bottom-16 z-10 hidden max-w-[200px] rounded-[22px] bg-[#D7720C] p-5 text-white shadow-xl shadow-[#D7720C]/20 sm:block">
            <span className="text-xs font-black uppercase tracking-[0.14em] text-white/75">Focus</span>
            <strong className="mt-2 block text-lg leading-tight">Complete products, not just screens.</strong>
          </div>
          <div className="overflow-hidden rounded-[30px] bg-[#0C2120] p-4 shadow-2xl shadow-[#0C2120]/20">
            <div className="relative aspect-[0.84] overflow-hidden rounded-[24px] bg-[#668A85]">
              <Image className="h-full w-full object-cover object-center" src="/pic.webp" alt="Mehfooz-ur-Rehman" width={720} height={840} priority />
            </div>
            <div className="mt-4 grid gap-3 rounded-[22px] bg-[#F1EFE5] p-4 text-[#0C2120] sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.14em] text-[#D7720C]">{profile.role}</span>
                <strong className="mt-1 block text-lg leading-tight">Web, mobile, desktop, AI and automation.</strong>
              </div>
              <a className="inline-flex size-12 items-center justify-center rounded-full bg-[#0C2120] text-[#F1EFE5]" href="#work" aria-label="View work">
                <ArrowUpRight size={20} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="services" className={`${sectionClass} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>What I build</p>
          <h2 className={`${displayClass} text-[clamp(1.75rem,3vw,3.25rem)]`}>Complete business systems, not isolated screens.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <article className={`${cardClass} p-6`} key={service.title}>
              <service.icon className="mb-5 text-[#D7720C]" size={28} aria-hidden="true" />
              <h3 className="mb-3 text-[1.1rem] font-black">{service.title}</h3>
              <p className="text-[0.95rem] leading-7 text-[#50463F]">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className={sectionClass}>
        <div className="mb-9 max-w-3xl">
          <p className={eyebrowClass}>Featured work</p>
          <h2 className={`${displayClass} text-[clamp(1.75rem,3vw,3.25rem)]`}>Products shaped around operations, revenue and daily use.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article className={`${cardClass} flex min-h-[360px] flex-col p-6`} key={project.title}>
              <div className="mb-5 grid size-11 place-items-center rounded-full bg-[#0C2120] text-[#F1EFE5]">
                <project.icon size={22} aria-hidden="true" />
              </div>
              <p className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#668A85]">{project.category}</p>
              <h3 className="mb-3 text-[1.45rem] font-black leading-tight">{project.title}</h3>
              <p className="text-[0.95rem] leading-7 text-[#50463F]">{project.summary}</p>
              <strong className="mt-4 block text-[0.95rem] leading-7">{project.businessValue}</strong>
              <div className="mt-auto flex flex-wrap gap-2 pt-6">
                {project.stack.map((item) => (
                  <span className="rounded-full border border-[#0C2120]/10 px-3 py-1.5 text-[0.7rem] font-black text-[#0C2120]" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} grid gap-10 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>Stack</p>
          <h2 className={`${displayClass} text-[clamp(1.75rem,3vw,3.25rem)]`}>Modern tools I already use to ship.</h2>
        </div>
        <div className="flex content-start flex-wrap gap-2">
          {stack.map((item) => (
            <span className="rounded-full border border-[#0C2120]/10 bg-[#F8F2E6] px-4 py-2 text-[0.8rem] font-black text-[#0C2120]" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} grid gap-4 md:grid-cols-3`}>
        {process.map((item) => (
          <article className={`${cardClass} p-6`} key={item.title}>
            <item.icon className="mb-5 text-[#D7720C]" size={28} aria-hidden="true" />
            <h3 className="mb-3 text-[1.1rem] font-black">{item.title}</h3>
            <p className="text-[0.95rem] leading-7 text-[#50463F]">{item.text}</p>
          </article>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="mb-9 max-w-3xl">
          <p className={eyebrowClass}>Testimonials</p>
          <h2 className={`${displayClass} text-[clamp(1.75rem,3vw,3.25rem)]`}>What clients and teammates already say.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote className={`${cardClass} p-6`} key={testimonial.name}>
              <p className={`${displayClass} text-[1.35rem] leading-tight`}>&ldquo;{testimonial.quote}&rdquo;</p>
              <footer className="mt-7 grid gap-1">
                <strong>{testimonial.name}</strong>
                <span className="text-[#50463F]">{testimonial.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-[#0C2120] text-[#F1EFE5]">
        <div className={`${sectionClass} grid gap-12 lg:grid-cols-[0.9fr_1.1fr]`}>
          <div>
            <p className="mb-4 flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#BCBDAC]">Start here</p>
            <h2 className={`${displayClass} text-[clamp(1.75rem,3vw,3.25rem)]`}>Need a reliable developer to build your product?</h2>
            <p className="mt-6 max-w-xl text-[1rem] leading-8 text-[#BCBDAC]">
              Send the workflow, product idea or stuck project. I am strongest when the job needs product thinking,
              full-stack execution and a practical launch path.
            </p>
            <div className="mt-8 grid gap-3 text-[#F1EFE5]">
              <a className="inline-flex items-center gap-3" href={`mailto:${profile.email}`}>
                <Mail size={18} aria-hidden="true" /> {profile.email}
              </a>
              <a className="inline-flex items-center gap-3" href={profile.whatsapp}>
                <MessageCircle size={18} aria-hidden="true" /> WhatsApp {profile.phone}
              </a>
              <a className="inline-flex items-center gap-3" href={`tel:${profile.phone.replaceAll(" ", "")}`}>
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
                <a className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-4 text-sm font-bold" href={href} target="_blank" rel="noreferrer" key={label}>
                  <Link size={16} aria-hidden="true" /> {label}
                </a>
              ))}
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </main>
  );
}

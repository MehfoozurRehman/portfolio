import Image from "next/image";
import { ArrowUpRight, Code2, Link, Mail, MessageCircle, Phone, Sparkles } from "lucide-react";
import { ContactForm } from "./contact-form";
import { process, profile, projects, services, stack, testimonials } from "./data";

const sectionClass = "mx-auto max-w-[1360px] px-5 py-12 sm:px-8 lg:px-12 xl:px-16 lg:py-16";
const eyebrowClass = "mb-4 flex items-center gap-2 text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#D7720C]";
const displayClass = "font-[family-name:var(--font-nunito)] font-black leading-[0.98] tracking-normal";
const cardClass = "rounded-[18px] border border-[#0C2120]/10 bg-[#F8F2E6]";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F1EFE5] text-[#0C2120]">
      <nav className="mx-auto flex max-w-[1360px] items-center justify-between px-5 pt-5 sm:px-8 lg:px-12 xl:px-16">
        <a className="grid size-10 place-items-center rounded-full bg-[#0C2120] text-[0.76rem] font-black text-[#F1EFE5]" href="#top">
          MR
        </a>
        <div className="flex items-center gap-0 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#50463F] sm:gap-2 sm:text-[0.72rem]">
          <a className="rounded-full px-2.5 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120] sm:px-3" href="#work">
            Work
          </a>
          <a className="rounded-full px-2.5 py-2 hover:bg-[#0C2120]/5 hover:text-[#0C2120] sm:px-3" href="#services">
            Services
          </a>
          <a className="rounded-full bg-[#0C2120] px-3 py-2 text-[#F1EFE5] hover:bg-[#D7720C] sm:px-4" href="#contact">
            Contact
          </a>
        </div>
      </nav>

      <section id="top" className="mx-auto grid max-w-[1360px] gap-10 px-5 pb-12 pt-10 sm:px-8 lg:min-h-[calc(100vh-65px)] lg:grid-cols-[0.98fr_1.02fr] lg:items-start lg:px-12 lg:pb-16 lg:pt-24 xl:px-16">
        <div className="max-w-[600px]">
          <p className={eyebrowClass}>
            <Sparkles size={14} aria-hidden="true" />
            Available for product builds
          </p>
          <h1 className={`${displayClass} text-[clamp(2.18rem,4.35vw,4.15rem)]`}>
            Building products from idea to launch.
          </h1>
          <h2 className="mt-5 max-w-[500px] text-[clamp(0.98rem,1.22vw,1.2rem)] font-black leading-[1.22] tracking-normal">
            I&apos;m Mehfooz-ur-Rehman, a full-stack developer for web, mobile, desktop, AI and automation systems.
          </h2>
          <p className="mt-5 max-w-[500px] text-[0.9rem] leading-7 text-[#50463F] sm:text-[0.95rem]">
            I turn messy operations into fast, reliable software: dashboards, apps, automation, AI assistants and complete SaaS products.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#D7720C] px-6 text-sm font-black text-white shadow-lg shadow-[#D7720C]/20" href="#contact">
              Let&apos;s build <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#0C2120]/15 px-5 text-sm font-black text-[#0C2120]" href={profile.github} target="_blank" rel="noreferrer">
              <Code2 size={18} aria-hidden="true" /> GitHub
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-7 gap-y-4 border-t border-[#0C2120]/10 pt-6">
            {[
              ["6+", "Years"],
              ["100", "Repos"],
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
        <div className="relative mx-auto w-full max-w-[500px] justify-self-center lg:mt-2 lg:justify-self-end">
          <div className="absolute -left-7 top-12 z-10 hidden rounded-full bg-[#BCBDAC] px-6 py-4 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[#0C2120] shadow-xl shadow-[#0C2120]/10 sm:block">
            Next.js / Convex / AI
          </div>
          <div className="absolute -right-4 bottom-20 z-10 hidden size-36 place-items-center rounded-full bg-[#D7720C] p-6 text-center text-white shadow-xl shadow-[#D7720C]/20 sm:grid">
            <strong className="text-[1.05rem] font-black leading-tight">Complete products, not just screens.</strong>
          </div>
          <div className="overflow-hidden rounded-[34px] bg-[#0C2120] p-4 shadow-2xl shadow-[#0C2120]/20">
            <div className="relative aspect-[0.9] overflow-hidden rounded-[28px] bg-[#668A85]">
              <Image className="h-full w-full object-cover object-center" src="/pic.webp" alt="Mehfooz-ur-Rehman" width={720} height={840} priority />
            </div>
            <div className="mt-4 grid gap-3 rounded-[24px] bg-[#F1EFE5] p-4 text-[#0C2120] sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#D7720C]">{profile.role}</span>
                <strong className="mt-1 block text-[1rem] leading-tight">Web, mobile, desktop, AI and automation.</strong>
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
          <h2 className={`${displayClass} text-[clamp(1.55rem,2.4vw,2.6rem)]`}>Complete business systems, not isolated screens.</h2>
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
          <h2 className={`${displayClass} text-[clamp(1.55rem,2.4vw,2.6rem)]`}>Products shaped around operations, revenue and daily use.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article className={`${cardClass} flex min-h-[360px] flex-col p-6`} key={project.title}>
              <div className="mb-5 grid size-11 place-items-center rounded-full bg-[#0C2120] text-[#F1EFE5]">
                <project.icon size={22} aria-hidden="true" />
              </div>
              <p className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#668A85]">{project.category}</p>
              <h3 className="mb-3 text-[1.25rem] font-black leading-tight">{project.title}</h3>
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
          <h2 className={`${displayClass} text-[clamp(1.55rem,2.4vw,2.6rem)]`}>Modern tools I already use to ship.</h2>
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
          <h2 className={`${displayClass} text-[clamp(1.55rem,2.4vw,2.6rem)]`}>What clients and teammates already say.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote className={`${cardClass} p-6`} key={testimonial.name}>
              <p className={`${displayClass} text-[1.15rem] leading-tight`}>&ldquo;{testimonial.quote}&rdquo;</p>
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
            <h2 className={`${displayClass} text-[clamp(1.55rem,2.4vw,2.6rem)]`}>Need a reliable developer to build your product?</h2>
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

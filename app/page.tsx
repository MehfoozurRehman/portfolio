import Image from "next/image";
import { ArrowUpRight, Code2, Link, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { process, profile, projects, services, stack, testimonials } from "./data";

const sectionClass = "mx-auto max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24";
const eyebrowClass = "mb-4 flex items-center gap-2 text-sm font-extrabold uppercase text-[#e6722e]";
const displayClass = "font-serif font-bold leading-[0.95] tracking-normal";
const cardClass = "rounded-lg border border-[#18231e]/15 bg-[#fff8ea]";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4ead7] text-[#18231e]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 sm:px-6 lg:px-8">
        <a className="grid size-12 place-items-center rounded-full bg-[#244438] text-sm font-black text-[#fff8ea]" href="#top">
          MR
        </a>
        <div className="flex items-center gap-1 text-sm font-bold text-[#6d766d] sm:gap-3">
          <a className="rounded-full px-3 py-2 hover:bg-[#18231e]/5 hover:text-[#18231e]" href="#work">
            Work
          </a>
          <a className="rounded-full px-3 py-2 hover:bg-[#18231e]/5 hover:text-[#18231e]" href="#services">
            Services
          </a>
          <a className="rounded-full px-3 py-2 hover:bg-[#18231e]/5 hover:text-[#18231e]" href="#contact">
            Contact
          </a>
        </div>
      </nav>

      <section id="top" className={`${sectionClass} grid min-h-[calc(100vh-72px)] items-center gap-12 pt-12 lg:grid-cols-[1.08fr_0.92fr]`}>
        <div>
          <p className={eyebrowClass}>
            <MapPin size={15} aria-hidden="true" />
            {profile.location}
          </p>
          <h1 className={`${displayClass} max-w-4xl text-[clamp(4rem,13vw,10.5rem)]`}>{profile.name}</h1>
          <h2 className={`${displayClass} mt-8 max-w-3xl text-[clamp(2.15rem,5vw,4.8rem)]`}>{profile.headline}</h2>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[#6d766d] sm:text-xl">{profile.subheadline}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#e6722e] px-6 font-extrabold text-white" href="#contact">
              Let&apos;s build <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <a className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#18231e]/15 px-6 font-extrabold text-[#244438]" href={profile.github} target="_blank" rel="noreferrer">
              <Code2 size={18} aria-hidden="true" /> GitHub
            </a>
          </div>
        </div>
        <div className="relative min-h-[460px] overflow-hidden rounded-lg bg-[#244438] shadow-2xl shadow-[#244438]/20 sm:min-h-[560px]">
          <Image className="h-full w-full object-cover" src="/pic.webp" alt="Mehfooz-ur-Rehman" width={620} height={720} priority />
          <div className="absolute inset-x-5 bottom-5 rounded-lg border border-[#18231e]/15 bg-[#fff8ea] p-5">
            <span className="text-sm font-bold text-[#6d766d]">Available for side-hustle client work</span>
            <strong className="mt-1 block text-lg">Full product builds, automation, AI and dashboards</strong>
          </div>
        </div>
      </section>

      <section className={`${sectionClass} grid gap-6 border-y border-[#18231e]/15 py-9 md:grid-cols-3`}>
        {[
          ["6+", "years building production apps"],
          ["100", "public GitHub repositories"],
          [profile.company, "current software-house experience"]
        ].map(([value, label]) => (
          <div className="grid gap-1" key={value}>
            <strong className={`${displayClass} text-4xl`}>{value}</strong>
            <span className="leading-6 text-[#6d766d]">{label}</span>
          </div>
        ))}
      </section>

      <section id="services" className={`${sectionClass} grid gap-12 lg:grid-cols-[0.8fr_1.2fr]`}>
        <div>
          <p className={eyebrowClass}>What I build</p>
          <h2 className={`${displayClass} text-[clamp(2.2rem,5vw,5rem)]`}>Complete business systems, not isolated screens.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {services.map((service) => (
            <article className={`${cardClass} p-7`} key={service.title}>
              <service.icon className="mb-6 text-[#e6722e]" size={30} aria-hidden="true" />
              <h3 className="mb-3 text-xl font-extrabold">{service.title}</h3>
              <p className="leading-7 text-[#6d766d]">{service.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="work" className={sectionClass}>
        <div className="mb-10 max-w-4xl">
          <p className={eyebrowClass}>Featured work</p>
          <h2 className={`${displayClass} text-[clamp(2.2rem,5vw,5rem)]`}>Products shaped around operations, revenue and daily use.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article className={`${cardClass} flex min-h-[420px] flex-col p-7`} key={project.title}>
              <div className="mb-6 grid size-12 place-items-center rounded-full bg-[#244438] text-[#fff8ea]">
                <project.icon size={24} aria-hidden="true" />
              </div>
              <p className="mb-2 text-xs font-black uppercase text-[#6d766d]">{project.category}</p>
              <h3 className="mb-3 text-2xl font-extrabold">{project.title}</h3>
              <p className="leading-7 text-[#6d766d]">{project.summary}</p>
              <strong className="mt-5 block leading-7">{project.businessValue}</strong>
              <div className="mt-auto flex flex-wrap gap-2 pt-7">
                {project.stack.map((item) => (
                  <span className="rounded-full border border-[#18231e]/15 px-3 py-2 text-xs font-extrabold text-[#244438]" key={item}>
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
          <h2 className={`${displayClass} text-[clamp(2.2rem,5vw,5rem)]`}>Modern tools I already use to ship.</h2>
        </div>
        <div className="flex content-start flex-wrap gap-2">
          {stack.map((item) => (
            <span className="rounded-full border border-[#18231e]/15 px-4 py-2 text-sm font-extrabold text-[#244438]" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className={`${sectionClass} grid gap-4 md:grid-cols-3`}>
        {process.map((item) => (
          <article className={`${cardClass} p-7`} key={item.title}>
            <item.icon className="mb-6 text-[#e6722e]" size={30} aria-hidden="true" />
            <h3 className="mb-3 text-xl font-extrabold">{item.title}</h3>
            <p className="leading-7 text-[#6d766d]">{item.text}</p>
          </article>
        ))}
      </section>

      <section className={sectionClass}>
        <div className="mb-10 max-w-4xl">
          <p className={eyebrowClass}>Testimonials</p>
          <h2 className={`${displayClass} text-[clamp(2.2rem,5vw,5rem)]`}>What clients and teammates already say.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <blockquote className={`${cardClass} p-7`} key={testimonial.name}>
              <p className={`${displayClass} text-2xl leading-tight`}>&ldquo;{testimonial.quote}&rdquo;</p>
              <footer className="mt-7 grid gap-1">
                <strong>{testimonial.name}</strong>
                <span className="text-[#6d766d]">{testimonial.role}</span>
              </footer>
            </blockquote>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-[#244438] text-[#fff8ea]">
        <div className={`${sectionClass} grid gap-12 lg:grid-cols-[0.9fr_1.1fr]`}>
          <div>
            <p className="mb-4 flex items-center gap-2 text-sm font-extrabold uppercase text-[#b6c6a1]">Start here</p>
            <h2 className={`${displayClass} text-[clamp(2.2rem,5vw,5rem)]`}>Need a reliable developer to build your product?</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[#b6c6a1]">
              Send the workflow, product idea or stuck project. I am strongest when the job needs product thinking,
              full-stack execution and a practical launch path.
            </p>
            <div className="mt-8 grid gap-3 text-[#fff8ea]">
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
          <form className="grid gap-4 rounded-lg border border-[#18231e]/15 bg-[#fff8ea] p-6 text-[#18231e]" action={`mailto:${profile.email}`} method="post" encType="text/plain">
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-[#244438]">Name</span>
              <input className="w-full rounded-lg border border-[#18231e]/15 bg-white/80 px-4 py-3 outline-none transition focus:border-[#e6722e]" name="name" autoComplete="name" required placeholder="Your name" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-[#244438]">Email</span>
              <input className="w-full rounded-lg border border-[#18231e]/15 bg-white/80 px-4 py-3 outline-none transition focus:border-[#e6722e]" name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-extrabold text-[#244438]">Project</span>
              <textarea className="min-h-36 w-full resize-y rounded-lg border border-[#18231e]/15 bg-white/80 px-4 py-3 outline-none transition focus:border-[#e6722e]" name="project" required placeholder="Tell me what you want to build, fix or automate." />
            </label>
            <button className="mt-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#e6722e] px-6 font-extrabold text-white" type="submit">
              Start a project <ArrowUpRight size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

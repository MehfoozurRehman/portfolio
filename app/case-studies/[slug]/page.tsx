import { ArrowLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { profile, projects } from "../../../data";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

const display =
  "font-[family-name:var(--font-nunito)] font-extrabold tracking-[-0.01em]";
const mono =
  "font-mono-label text-[0.66rem] font-semibold uppercase tracking-[0.18em]";

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  const shell = "mx-auto w-full max-w-[1100px] px-5 sm:px-8 lg:px-10";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[var(--color-page)] text-[var(--color-text)]">
      <div
        className="halo -left-[10%] -top-[6%] h-[34rem] w-[34rem]"
        style={{ background: "var(--halo-a)" }}
      />

      <div className={`${shell} relative z-10 pb-20 pt-10`}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border-card)] bg-[var(--color-field)] px-4 py-2 text-[0.78rem] font-bold text-[var(--color-text)] transition hover:border-[var(--border-hover)] hover:text-[var(--color-accent)]"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back to portfolio
        </Link>

        <section className="mt-10 grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-start">
          <div className="max-w-2xl">
            <p className={`${mono} text-[var(--color-accent)]`}>Case study</p>
            <p className={`${mono} mt-3 text-[var(--color-soft)]`}>
              {project.category}
            </p>
            <h1 className={`${display} mt-4 text-[clamp(2.4rem,5vw,4.4rem)] leading-[0.95]`}>
              {project.title}
            </h1>
            <p className="mt-6 max-w-xl text-[1rem] leading-8 text-[var(--color-muted)]">
              {project.summary}
            </p>
            <div className="mt-7 flex flex-wrap gap-1.5">
              {project.highlights.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--color-raise)] px-2.5 py-1 font-mono-label text-[0.64rem] font-semibold text-[var(--color-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-xl border border-[var(--border-card)] bg-[var(--color-page)]">
                  {project.logoUrl ? (
                    <Image
                      src={project.logoUrl}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 object-contain"
                      aria-hidden="true"
                    />
                  ) : (
                    <project.icon
                      size={20}
                      className="text-[var(--color-accent)]"
                      aria-hidden="true"
                    />
                  )}
                </span>
                <div>
                  <p className={`${mono} text-[var(--color-soft)]`}>Snapshot</p>
                  <p className="mt-1 text-[0.95rem] font-extrabold">
                    {project.title}
                  </p>
                </div>
              </div>
              {project.url ? (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-inverse)] px-3 py-1.5 text-[0.72rem] font-bold text-[var(--color-inverse-text)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-on-accent)]"
                >
                  Visit <ArrowUpRight size={13} aria-hidden="true" />
                </a>
              ) : null}
            </div>

            {project.heroImageUrl ? (
              <div className="mt-5 overflow-hidden rounded-xl border border-[var(--border-card)]">
                <Image
                  src={project.heroImageUrl}
                  alt={`${project.title} screenshot`}
                  width={1200}
                  height={760}
                  className="h-auto w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {[
                ["Role", "Full-stack delivery"],
                ["Focus", project.category],
                ["Stack", project.stack[0] ?? "Web"],
                ["Mode", "Product build"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[var(--border-card)] bg-[var(--color-page)] p-3"
                >
                  <p className={`${mono} text-[var(--color-accent)]`}>{label}</p>
                  <p className="mt-1 text-[0.82rem] font-bold">{value}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-10 grid gap-3 md:grid-cols-3">
          {[
            ["Problem", project.problem],
            ["Approach", project.approach],
            ["Outcome", project.outcome],
          ].map(([label, value], i) => (
            <article
              key={label}
              className="card-hover rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6"
            >
              <span className="font-mono-label text-[0.7rem] font-semibold text-[var(--color-soft)]">
                0{i + 1}
              </span>
              <p className={`${mono} mt-2 text-[var(--color-accent)]`}>{label}</p>
              <p className="mt-3 text-[0.92rem] leading-7 text-[var(--color-muted)]">
                {value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-3 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6">
            <p className={`${mono} text-[var(--color-accent)]`}>
              Responsibilities
            </p>
            <ul className="mt-4 grid gap-3 text-[0.92rem] leading-7 text-[var(--color-muted)]">
              {project.responsibilities.map((item) => (
                <li className="flex gap-3" key={item}>
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-[var(--color-accent-2)]"
                    size={17}
                    aria-hidden="true"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6">
            <p className={`${mono} text-[var(--color-accent)]`}>Stack</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {project.stack.map((item) => (
                <span
                  key={item}
                  className="rounded-md border border-[var(--border-subtle)] bg-[var(--color-page)] px-2.5 py-1 font-mono-label text-[0.64rem] font-semibold text-[var(--color-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-5 rounded-xl border border-[var(--border-card)] bg-[var(--color-page)] p-4">
              <p className={`${mono} text-[var(--color-soft)]`}>At a glance</p>
              <p className="mt-2 text-[0.9rem] leading-7 text-[var(--color-muted)]">
                {project.businessValue}
              </p>
            </div>
          </article>
        </section>

        <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-2xl border border-[var(--border-card)] bg-[var(--color-page-soft)] p-6 sm:flex-row sm:items-center">
          <div>
            <p className={`${display} text-[1.2rem]`}>
              Building something similar?
            </p>
            <p className="mt-1 text-[0.9rem] text-[var(--color-muted)]">
              Let&apos;s talk about your product.
            </p>
          </div>
          <a
            href={`mailto:${profile.email}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-[0.88rem] font-bold text-[var(--color-on-accent)] shadow-lg shadow-[color:var(--shadow-accent)]"
          >
            {profile.email}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </section>
      </div>
    </main>
  );
}

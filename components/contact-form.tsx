"use client";

import { FormEvent, useEffect, useState } from "react";

import { ArrowUpRight } from "lucide-react";
import emailjs from "@emailjs/browser";

type SubmissionState = "idle" | "submitting" | "submitted" | "failed";

const inputClass =
  "w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--color-field)] px-4 py-3 text-[0.9rem] outline-none transition hover:border-[var(--border-input-hover)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15";
const labelClass =
  "font-mono-label text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-soft)]";

let emailjsInitialized = false;

export function ContactForm() {
  const [submissionState, setSubmissionState] =
    useState<SubmissionState>("idle");

  useEffect(() => {
    if (emailjsInitialized) return;
    const publicKey =
      process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY ??
      "user_5E0L53uCeIn6J8FtgNgs8";
    if (publicKey) {
      emailjs.init(publicKey);
      emailjsInitialized = true;
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmissionState("submitting");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const lead = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      project: String(formData.get("project") ?? "").trim(),
    };

    try {
      if (!lead.name || !lead.email || !lead.project) {
        throw new Error("Missing required fields");
      }

      const serviceId =
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID ?? "service_3dm7yud";
      const templateId =
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID ?? "template_vu88eib";

      if (!serviceId || !templateId) {
        throw new Error("Email service is not configured");
      }

      await emailjs.send(serviceId, templateId, {
        from_name: lead.name,
        from_email: lead.email,
        message: lead.project,
        to_email: "mehfoozijaz786@gmail.com",
        reply_to: lead.email.toLowerCase(),
      });

      form.reset();
      setSubmissionState("submitted");
    } catch {
      setSubmissionState("failed");
    }
  }

  return (
    <form
      className="grid gap-5 rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6 text-[var(--color-text)] shadow-[0_20px_50px_-40px_var(--shadow-strong)] sm:p-7"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2">
        <span className={labelClass}>Name</span>
        <input
          className={inputClass}
          name="name"
          autoComplete="name"
          required
          placeholder="Your name"
        />
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Email</span>
        <input
          className={inputClass}
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
        />
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Project</span>
        <textarea
          className={`${inputClass} min-h-44 resize-y`}
          name="project"
          required
          placeholder="Tell me what you want to build, fix or automate."
        />
      </label>
      <button
        className="group mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-[0.92rem] font-bold text-[var(--color-on-accent)] shadow-lg shadow-[color:var(--shadow-accent)] transition hover:shadow-xl disabled:cursor-wait disabled:opacity-70"
        type="submit"
        disabled={submissionState === "submitting"}
      >
        {submissionState === "submitting" ? "Sending..." : "Start a project"}
        <ArrowUpRight
          size={18}
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </button>
      {submissionState === "submitted" ? (
        <p className="leading-6 text-[var(--color-text)]">
          Thanks. Your message has been sent to my email.
        </p>
      ) : null}
      {submissionState === "failed" ? (
        <p className="leading-6 text-[var(--color-danger)]">
          Something failed. Please try again or email me directly.
        </p>
      ) : null}
    </form>
  );
}

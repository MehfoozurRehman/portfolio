"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { profile } from "./data";

type SubmissionState = "idle" | "submitting" | "submitted" | "failed";

const inputClass =
  "w-full rounded-[14px] border border-[#0C2120]/10 bg-white/70 px-4 py-2.5 text-[0.86rem] outline-none transition focus:border-[#D7720C] sm:py-3 sm:text-[0.9rem]";

export function ContactForm() {
  const [submissionState, setSubmissionState] = useState<SubmissionState>("idle");

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

      const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_SITE_URL;

      if (convexSiteUrl) {
        const response = await fetch(`${convexSiteUrl}/portfolioLead`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        });

        if (!response.ok) {
          throw new Error("Convex lead submission failed");
        }
      } else {
        const subject = encodeURIComponent(`Portfolio inquiry from ${lead.name}`);
        const body = encodeURIComponent(`${lead.project}\n\nReply to: ${lead.email}`);
        window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      }

      form.reset();
      setSubmissionState("submitted");
    } catch {
      setSubmissionState("failed");
    }
  }

  return (
    <form className="grid gap-4 border-y border-[#0C2120]/10 bg-[#F8F2E6] py-6 text-[#0C2120] sm:border sm:px-6" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-[0.82rem] font-black text-[#0C2120]">Name</span>
        <input className={inputClass} name="name" autoComplete="name" required placeholder="Your name" />
      </label>
      <label className="grid gap-2">
        <span className="text-[0.82rem] font-black text-[#0C2120]">Email</span>
        <input className={inputClass} name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </label>
      <label className="grid gap-2">
        <span className="text-[0.82rem] font-black text-[#0C2120]">Project</span>
        <textarea className={`${inputClass} min-h-36 resize-y`} name="project" required placeholder="Tell me what you want to build, fix or automate." />
      </label>
      <button
        className="mt-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#D7720C] px-6 text-[0.9rem] font-black text-white shadow-lg shadow-[#D7720C]/20 disabled:cursor-wait disabled:opacity-70 sm:min-h-12 sm:text-base"
        type="submit"
        disabled={submissionState === "submitting"}
      >
        {submissionState === "submitting" ? "Sending..." : "Start a project"}
        <ArrowUpRight size={18} aria-hidden="true" />
      </button>
      {submissionState === "submitted" ? <p className="leading-6 text-[#0C2120]">Thanks. Your message is ready for follow-up.</p> : null}
      {submissionState === "failed" ? <p className="leading-6 text-red-700">Something failed. Please try again or email me directly.</p> : null}
    </form>
  );
}

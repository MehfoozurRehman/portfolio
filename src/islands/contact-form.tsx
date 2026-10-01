import { useState } from 'react';
import type { FormEvent } from 'react';

type SubmissionState = 'idle' | 'submitting' | 'submitted' | 'failed';

const inputClass =
  'w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--color-field)] px-4 py-3 text-[0.9rem] outline-none transition hover:border-[var(--border-input-hover)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15';
const labelClass = 'font-mono-label text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-soft)]';

// EmailJS keys are public by design (they ship to the browser); override via PUBLIC_* env vars.
const env = import.meta.env;
const PUBLIC_KEY = env.PUBLIC_EMAILJS_PUBLIC_KEY ?? 'user_5E0L53uCeIn6J8FtgNgs8';
const SERVICE_ID = env.PUBLIC_EMAILJS_SERVICE_ID ?? 'service_3dm7yud';
const TEMPLATE_ID = env.PUBLIC_EMAILJS_TEMPLATE_ID ?? 'template_vu88eib';
const TO_EMAIL = env.PUBLIC_CONTACT_EMAIL ?? 'mehfoozijaz786@gmail.com';

export default function ContactForm() {
  const [state, setState] = useState<SubmissionState>('idle');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('submitting');

    const form = event.currentTarget;
    const data = new FormData(form);
    const lead = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      project: String(data.get('project') ?? '').trim(),
    };

    try {
      if (!lead.name || !lead.email || !lead.project) throw new Error('Missing required fields');
      // Honeypot: bots fill hidden fields, humans never see it.
      if (String(data.get('website') ?? '')) {
        form.reset();
        setState('submitted');
        return;
      }

      // Load the EmailJS SDK only when someone actually sends a message.
      const { default: emailjs } = await import('@emailjs/browser');
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          from_name: lead.name,
          from_email: lead.email,
          message: lead.project,
          to_email: TO_EMAIL,
          reply_to: lead.email.toLowerCase(),
        },
        { publicKey: PUBLIC_KEY },
      );

      form.reset();
      setState('submitted');
    } catch {
      setState('failed');
    }
  }

  return (
    <form
      className="grid gap-5 rounded-2xl border border-[var(--border-card)] bg-[var(--color-raise)] p-6 text-[var(--color-text)] shadow-[0_20px_50px_-40px_var(--shadow-strong)] sm:p-7"
      onSubmit={handleSubmit}
    >
      <label className="grid gap-2">
        <span className={labelClass}>Name</span>
        <input className={inputClass} name="name" autoComplete="name" required placeholder="Your name" />
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Email</span>
        <input className={inputClass} name="email" type="email" autoComplete="email" required placeholder="you@company.com" />
      </label>
      <label className="grid gap-2">
        <span className={labelClass}>Project</span>
        <textarea className={`${inputClass} min-h-44 resize-y`} name="project" required placeholder="Tell me what you want to build, fix or automate." />
      </label>
      <input className="hidden" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button
        className="group mt-1 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-6 text-[0.92rem] font-bold text-[var(--color-on-accent)] shadow-lg shadow-[color:var(--shadow-accent)] transition hover:shadow-xl disabled:cursor-wait disabled:opacity-70"
        type="submit"
        disabled={state === 'submitting'}
      >
        {state === 'submitting' ? 'Sending...' : 'Start a project'}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          <path d="M7 7h10v10" />
          <path d="M7 17 17 7" />
        </svg>
      </button>
      <div aria-live="polite">
        {state === 'submitted' ? <p className="leading-6 text-[var(--color-text)]">Thanks. Your message has been sent to my email.</p> : null}
        {state === 'failed' ? <p className="leading-6 text-[var(--color-danger)]">Something failed. Please try again or email me directly.</p> : null}
      </div>
    </form>
  );
}

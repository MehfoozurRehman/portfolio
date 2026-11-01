// Contact form sent through EmailJS (the same service and template the previous site used).
// EmailJS keys are public by design; override them with VITE_EMAILJS_* env vars.
import { track } from '../core/analytics.js';

const env = import.meta.env;
const PUBLIC_KEY = env.VITE_EMAILJS_PUBLIC_KEY ?? 'user_5E0L53uCeIn6J8FtgNgs8';
const SERVICE_ID = env.VITE_EMAILJS_SERVICE_ID ?? 'service_3dm7yud';
const TEMPLATE_ID = env.VITE_EMAILJS_TEMPLATE_ID ?? 'template_vu88eib';
const TO_EMAIL = env.VITE_CONTACT_EMAIL ?? 'mehfoozijaz786@gmail.com';

export function contactFormHTML(source) {
  return `<form class="contact-form" data-contact-form="${source}" novalidate>
    <label><span>Name</span><input name="name" autocomplete="name" required placeholder="Your name"></label>
    <label><span>Email</span><input name="email" type="email" autocomplete="email" required placeholder="you@company.com"></label>
    <label><span>Project</span><textarea name="project" required rows="4" placeholder="Tell me what you want to build, fix or automate."></textarea></label>
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <button class="btn btn-primary btn-small" type="submit">Send message</button>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form>`;
}

// Delegated: one listener per container handles every form rendered into it later.
export function bindContactForms(root) {
  root.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-contact-form]');
    if (!form) return;
    e.preventDefault();
    const status = form.querySelector('.form-status');
    const button = form.querySelector('button[type="submit"]');
    const data = new FormData(form);
    const lead = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      project: String(data.get('project') ?? '').trim(),
    };
    const say = (text, kind = '') => { status.textContent = text; status.dataset.kind = kind; };

    if (!lead.name || !lead.project || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      say('Please add your name, a valid email and a few words about the project.', 'error');
      return;
    }
    // Honeypot: bots fill hidden fields, humans never see it.
    if (String(data.get('website') ?? '')) { form.reset(); say('Thanks. Your message has been sent.', 'ok'); return; }

    button.disabled = true;
    button.textContent = 'Sending…';
    say('');
    try {
      // Load the EmailJS SDK only when someone actually sends a message.
      const { default: emailjs } = await import('@emailjs/browser');
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        from_name: lead.name,
        from_email: lead.email,
        message: lead.project,
        to_email: TO_EMAIL,
        reply_to: lead.email.toLowerCase(),
      }, { publicKey: PUBLIC_KEY });
      form.reset();
      say("Thanks. Your message is in my inbox, and I'll reply by email.", 'ok');
      track('generate_lead', { method: 'contact_form', source: form.dataset.contactForm });
    } catch {
      say(`Something failed. Please try again or email ${TO_EMAIL} directly.`, 'error');
      track('contact_form_error', { source: form.dataset.contactForm });
    } finally {
      button.disabled = false;
      button.textContent = 'Send message';
    }
  });
}

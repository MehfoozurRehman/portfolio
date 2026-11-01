// HUD, prompt, toasts, world-anchored bubbles, panels (built from the real content), map and classic view.
import * as THREE from 'three';
import { profile, hero, about, services, process, work, experience, education, stack, testimonials, contact, socials } from '@shared/content.js';
import github from '../data/github.json';
import { timeline } from '../world/builder.js';
import { contactFormHTML, bindContactForms } from './contact.js';
import { track } from '../core/analytics.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export class UI {
  constructor() {
    this.panel = $('#panel');
    this.panelBody = $('#panel-body');
    this.prompt = $('#prompt');
    this.promptText = $('#prompt-text');
    this.promptKey = $('#prompt-key');
    this.promptRing = $('#prompt-ring');
    this.toasts = $('#toasts');
    this.bubbleLayer = $('#bubbles');
    this.bubbles = new Map();
    this.onClose = null;
    this.panelOpen = false;
    $('#panel-close').addEventListener('click', () => this.closePanel());
    addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (this.panelOpen) this.closePanel(); else if (!$('#map').hidden) this.closeMap(); else if (!$('#classic').hidden) this.closeClassic(); } });
    $('#brand-img').src = profile.portrait;
    $('#map-close').addEventListener('click', () => this.closeMap());
    $('#map').addEventListener('click', (e) => { if (e.target.id === 'map') this.closeMap(); });
    this.panelBody.addEventListener('click', (e) => this.handlePanelClick(e));
    bindContactForms(this.panelBody);
    bindContactForms($('#classic'));
    // Outbound links (projects, socials, WhatsApp, GitHub) from anywhere in the UI.
    addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="http"]');
      if (a) track('click', { link_url: a.href, link_text: a.textContent.trim().slice(0, 60), outbound: true });
    });
  }

  // ---------- prompt ----------
  showPrompt(text, { key = 'E', hold = 0 } = {}) {
    if (this.prompt.hidden || this.promptText.textContent !== text) {
      this.promptText.textContent = text;
      this.promptKey.textContent = key;
      this.prompt.hidden = false;
    }
    this.promptRing.style.strokeDashoffset = String(106.8 * (1 - hold));
  }
  hidePrompt() { this.prompt.hidden = true; }

  // ---------- toasts ----------
  toast(title, sub = '', icon = '✦', ms = 3600) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<span class="t-ic">${esc(icon)}</span><span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>`;
    this.toasts.appendChild(el);
    // Never stack more than three: the oldest gives way.
    const live = [...this.toasts.querySelectorAll('.toast:not(.out)')];
    while (live.length > 3) { const old = live.shift(); old.classList.add('out'); setTimeout(() => old.remove(), 320); }
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, ms);
  }

  // ---------- bubbles anchored to world points ----------
  bubble(id, html, { anchor, kind = '', ttl = 0, wide = false } = {}) {
    let b = this.bubbles.get(id);
    if (!b) {
      const el = document.createElement('div');
      el.className = `bubble ${kind} ${wide ? 'wide' : ''}`;
      this.bubbleLayer.appendChild(el);
      b = { el, anchor: new THREE.Vector3() };
      this.bubbles.set(id, b);
    }
    b.el.innerHTML = html;
    if (anchor) b.anchor.copy(anchor);
    b.follow = anchor && anchor.isObject3D ? anchor : null;
    b.until = ttl ? performance.now() + ttl : 0;
    return b;
  }
  bubbleAt(id, html, obj, offsetY, opts = {}) {
    const b = this.bubble(id, html, opts);
    b.obj = obj;
    b.offsetY = offsetY;
    return b;
  }
  removeBubble(id) { const b = this.bubbles.get(id); if (b) { b.el.remove(); this.bubbles.delete(id); } }
  updateBubbles(camera, w, h) {
    const v = new THREE.Vector3();
    for (const [id, b] of this.bubbles) {
      if (b.until && performance.now() > b.until) { this.removeBubble(id); continue; }
      if (b.obj) { b.obj.getWorldPosition(v); v.y += b.offsetY || 0; } else v.copy(b.anchor);
      v.project(camera);
      const vis = v.z < 1 && Math.abs(v.x) < 1.15 && Math.abs(v.y) < 1.15;
      b.el.style.opacity = vis ? '1' : '0';
      b.el.style.left = `${((v.x + 1) / 2) * w}px`;
      b.el.style.top = `${((1 - v.y) / 2) * h}px`;
    }
  }

  // ---------- panels ----------
  openPanel(id, { onClose } = {}) {
    const html = this.panelHTML(id);
    if (!html) return false;
    this.panelBody.innerHTML = html;
    this.panel.classList.toggle('wide', id.startsWith('project:') || id === 'repos');
    this.panel.hidden = false;
    this.panelOpen = true;
    this.onClose = onClose || null;
    this.panelBody.scrollTop = 0;
    const [kind, arg] = id.split(/:(.*)/s);
    track('panel_open', { panel: kind, item: arg || kind });
    setTimeout(() => $('#panel-close').focus({ preventScroll: true }), 50);
    return true;
  }
  closePanel() {
    if (!this.panelOpen) return;
    this.panel.hidden = true;
    this.panelOpen = false;
    const cb = this.onClose;
    this.onClose = null;
    cb?.();
    document.getElementById('scene').focus({ preventScroll: true });
  }

  handlePanelClick(e) {
    const copy = e.target.closest('[data-copy]');
    if (copy) {
      const text = copy.dataset.copy;
      const done = () => { copy.textContent = 'Copied'; setTimeout(() => (copy.textContent = 'Copy'), 1600); };
      try {
        navigator.clipboard.writeText(text).then(done, () => this.selectText(copy.previousElementSibling));
      } catch { this.selectText(copy.previousElementSibling); }
      return;
    }
    const go = e.target.closest('[data-panel]');
    if (go) { e.preventDefault(); this.openPanel(go.dataset.panel, { onClose: this.onClose }); }
    const act = e.target.closest('[data-act]');
    if (act) { e.preventDefault(); this.onAction?.(act.dataset.act); }
  }
  selectText(el) {
    if (!el) return;
    const r = document.createRange();
    r.selectNodeContents(el);
    const s = getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }

  panelHTML(id) {
    const [kind, arg] = id.split(/:(.*)/s);
    if (kind === 'about') {
      return `<img class="portrait-sm" src="${profile.portrait}" alt="Portrait of ${esc(profile.name)}">
        <p class="kicker">${esc(profile.role)} · ${esc(profile.company)}</p>
        <h2>${esc(about.heading)}</h2>
        <div class="stats">${hero.stats.map((s) => `<div><b>${esc(s.value)}</b><small>${esc(s.label)}</small></div>`).join('')}</div>
        <p>${esc(about.body[0])}</p>
        <h3>What I bring</h3>
        ${about.highlights.map((h) => `<div class="pair"><dt>${esc(h.title)}</dt><dd>${esc(h.text)}</dd></div>`).join('')}
        <div class="actions"><button class="btn btn-primary btn-small" data-panel="contact">Let's build</button><button class="btn btn-ghost btn-small" data-act="classic">Read the full story</button></div>`;
    }
    if (kind === 'service') {
      const s = services.items.find((x) => x.id === arg);
      if (!s) return null;
      return `<p class="kicker">Service</p><h2>${esc(s.title)}</h2><p>${esc(s.description)}</p>
        <h3>How I work</h3>${process.steps.map((p, i) => `<div class="pair"><dt>${i + 1}. ${esc(p.title)}</dt><dd>${esc(p.text)}</dd></div>`).join('')}
        <div class="actions"><button class="btn btn-primary btn-small" data-panel="contact">Hire me for this</button></div>`;
    }
    if (kind === 'timeline') {
      if (arg === 'today') {
        const now = experience.items.filter((x) => /Present/.test(x.period));
        return `<p class="kicker">The summit</p><h2>Today</h2><p>${esc(about.body[1])}</p>
          ${now.map((x) => `<div class="pair"><dt>${esc(x.period)}</dt><dd><b>${esc(x.role)}</b>, ${esc(x.company)}</dd></div>`).join('')}
          <div class="actions"><button class="btn btn-primary btn-small" data-panel="contact">Work with me</button></div>`;
      }
      const t = timeline()[+arg];
      if (!t) return null;
      return `<p class="kicker">${esc(t.year)} · ${esc(t.period)}</p><h2>${esc(t.title)}</h2><p><b>${esc(t.org)}</b></p><p>${esc(t.text)}</p>`;
    }
    if (kind === 'project') {
      const p = work.projects.find((x) => x.slug === arg);
      if (!p) return null;
      return `<p class="kicker">${esc(p.category)}</p><h2>${esc(p.title)}</h2>
        <img class="shot" src="${p.image}" alt="${esc(p.name)} preview">
        <div class="result">${esc(p.result)}</div>
        <ul class="chips mint">${p.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>
        <dl>
          <div class="pair"><dt>Problem</dt><dd>${esc(p.problem)}</dd></div>
          <div class="pair"><dt>Approach</dt><dd>${esc(p.approach)}</dd></div>
          <div class="pair"><dt>Outcome</dt><dd>${esc(p.outcome)}</dd></div>
          <div class="pair"><dt>Business value</dt><dd>${esc(p.businessValue)}</dd></div>
        </dl>
        <h3>Stack</h3><ul class="chips">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        <div class="actions">${p.url ? `<a class="btn btn-ghost btn-small" href="${p.url}" target="_blank" rel="noopener">Visit ${esc(p.urlLabel || 'project')} ↗</a>` : ''}<button class="btn btn-primary btn-small" data-panel="contact">Build something like this</button></div>`;
    }
    if (kind === 'repos') {
      const repos = [...github.repos].sort((a, b) => (b.pushed || '').localeCompare(a.pushed || ''));
      return `<p class="kicker">The library · @${esc(github.user.login)}</p><h2>${esc(github.user.publicRepos)} public repositories</h2>
        <p>On GitHub since ${esc(github.user.since?.slice(0, 4))}. Recently updated first.</p>
        ${repos.slice(0, 40).map((r) => `<a class="repo" href="${r.url}" target="_blank" rel="noopener"><b>${esc(r.name)}</b><small>${esc([r.language, r.stars ? `★ ${r.stars}` : null, r.pushed ? `updated ${r.pushed}` : null].filter(Boolean).join(' · '))}</small>${r.description ? `<small>${esc(r.description)}</small>` : ''}</a>`).join('')}
        <div class="actions"><a class="btn btn-primary btn-small" href="https://github.com/${esc(github.user.login)}?tab=repositories" target="_blank" rel="noopener">See all on GitHub ↗</a></div>`;
    }
    if (kind === 'garden') {
      const total = github.total?.lastYear ?? 0;
      const days = github.days.filter((d) => d[1] > 0).length;
      const best = github.days.reduce((a, d) => (d[1] > a[1] ? d : a), ['', 0]);
      return `<p class="kicker">The GitHub Garden</p><h2>A year of commits, planted.</h2>
        <p>Every tile in this garden is one day of the past year. The taller the plant, the more I shipped that day.</p>
        <div class="stats"><div><b>${total.toLocaleString('en-US')}</b><small>contributions</small></div><div><b>${days}</b><small>active days</small></div><div><b>${best[1]}</b><small>best day</small></div></div>
        <p>Data from my public GitHub profile, collected ${esc(github.fetchedAt)}.</p>
        <div class="actions"><a class="btn btn-ghost btn-small" href="https://github.com/${esc(github.user.login)}" target="_blank" rel="noopener">Open GitHub ↗</a><button class="btn btn-primary btn-small" data-panel="repos">Browse repositories</button></div>`;
    }
    if (kind === 'stack') {
      return `<p class="kicker">The toolshed</p><h2>${esc(stack.heading)}</h2>${stack.groups.map((g) => `<h3>${esc(g.label)}</h3><ul class="chips">${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`).join('')}`;
    }
    if (kind === 'contact') {
      return `<p class="kicker">Lighthouse post</p><h2>${esc(contact.heading)}</h2><p>${esc(contact.body)}</p>
        ${contactFormHTML('lighthouse')}
        <p class="contact-or">Or reach me directly</p>
        <div class="copyline"><span>${esc(profile.email)}</span><button type="button" data-copy="${esc(profile.email)}">Copy</button></div>
        <div class="copyline"><span>${esc(profile.phone)}</span><button type="button" data-copy="${esc(profile.phone)}">Copy</button></div>
        <div class="actions"><a class="btn btn-primary btn-small" href="${profile.whatsapp}" target="_blank" rel="noopener">Message on WhatsApp ↗</a></div>
        <div class="socials">${socials.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')}</div>`;
    }
    if (kind === 'testimonial') {
      const t = testimonials.items[+arg];
      return t ? `<p class="kicker">Park of Voices</p><p class="quote">"${esc(t.quote)}"</p><p><b>${esc(t.name)}</b>, ${esc(t.role)}</p>` : null;
    }
    return null;
  }

  // ---------- map ----------
  openMap(world, player, onPick) {
    const svg = $('#map-svg');
    const b = world.bounds;
    const pad = 22;
    const minX = b.minX + pad, maxX = b.maxX - pad, minZ = b.minZ + pad, maxZ = b.maxZ - pad;
    const s = 100 / Math.max(maxX - minX, maxZ - minZ);
    const X = (x) => (x - minX) * s, Z = (z) => (z - minZ) * s;
    svg.setAttribute('viewBox', `0 0 ${((maxX - minX) * s).toFixed(1)} ${((maxZ - minZ) * s).toFixed(1)}`);
    const colors = { grass: '#74C391', grass_deep: '#2E9B78', sand: '#F1DCC2', stone: '#E3D8CF', cream: '#F3EDE6' };
    let html = '';
    for (const r of world.physicsRegions || []) {
      if (r.kind === 'rect') {
        const x1 = r.x - r.s * r.hl, z1 = r.z - r.c * r.hl, x2 = r.x + r.s * r.hl, z2 = r.z + r.c * r.hl;
        html += `<line x1="${X(x1).toFixed(1)}" y1="${Z(z1).toFixed(1)}" x2="${X(x2).toFixed(1)}" y2="${Z(z2).toFixed(1)}" stroke="#C98C62" stroke-width="${(1.4 * s).toFixed(2)}" stroke-linecap="round"></line>`;
      } else if (r.kind === 'disc') html += `<circle cx="${X(r.x).toFixed(1)}" cy="${Z(r.z).toFixed(1)}" r="${(0.7 * s).toFixed(2)}" fill="#E3D8CF"></circle>`;
    }
    for (const isl of Object.values(world.islands)) {
      html += `<g class="isl" data-island="${isl.id}">`;
      for (const t of isl.tiles) {
        const pts = [];
        for (let i = 0; i < 6; i++) { const a = (Math.PI / 180) * (60 * i - 30); pts.push(`${X(t.x + 2 * Math.cos(a)).toFixed(2)},${Z(t.z + 2 * Math.sin(a)).toFixed(2)}`); }
        html += `<polygon points="${pts.join(' ')}" fill="${colors[t.type] || '#74C391'}" stroke="#F3EDE6" stroke-width="0.25"></polygon>`;
      }
      const place = world.places.find((p) => p.id === isl.id);
      const visited = world.visited?.has(isl.id);
      html += `<text x="${X(place.x).toFixed(1)}" y="${(Z(place.z) + 0.9).toFixed(1)}" text-anchor="middle">${visited ? '✓ ' : ''}${esc(place.label)}</text></g>`;
    }
    html += `<circle cx="${X(player.pos.x).toFixed(1)}" cy="${Z(player.pos.z).toFixed(1)}" r="1.4" fill="#E9775A" stroke="#fff" stroke-width="0.5"></circle>`;
    svg.innerHTML = html;
    svg.querySelectorAll('.isl').forEach((g) => g.addEventListener('click', () => { onPick(g.dataset.island); this.closeMap(); }));
    $('#map').hidden = false;
    this.mapOpen = true;
  }
  closeMap() { $('#map').hidden = true; this.mapOpen = false; }

  // ---------- classic view ----------
  openClassic() {
    const el = $('#classic');
    if (!el.dataset.ready) {
      el.innerHTML = classicHTML();
      el.dataset.ready = '1';
      el.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-classic]')) this.closeClassic();
        const copy = e.target.closest('[data-copy]');
        if (copy) { try { navigator.clipboard.writeText(copy.dataset.copy).then(() => { copy.textContent = 'Copied'; setTimeout(() => (copy.textContent = 'Copy'), 1500); }, () => this.selectText(copy.previousElementSibling)); } catch { this.selectText(copy.previousElementSibling); } }
      });
    }
    el.hidden = false;
    el.focus({ preventScroll: true });
    this.classicOpen = true;
    track('classic_view_open');
  }
  closeClassic() { $('#classic').hidden = true; this.classicOpen = false; }
}

function classicHTML() {
  return `<div class="classic-inner">
    <div class="classic-top"><b style="font:700 18px var(--display)">${esc(profile.name)}</b><button class="btn btn-primary btn-small" data-close-classic>Back to the isles</button></div>
    <section class="c-hero">
      <div><p class="kicker">${esc(profile.availability)}</p><h1>Products built from <em>idea</em> to launch.</h1><p>${esc(hero.intro)}</p>
      <div class="stats" style="max-width:520px">${hero.stats.map((s) => `<div><b>${esc(s.value)}</b><small>${esc(s.label)}</small></div>`).join('')}</div></div>
      <img src="${profile.portrait}" alt="Portrait of ${esc(profile.name)}">
    </section>
    <h2>${esc(about.heading)}</h2>${about.body.map((p) => `<p>${esc(p)}</p>`).join('')}
    <div class="c-grid">${about.highlights.map((h) => `<div class="c-card"><h3>${esc(h.title)}</h3><p>${esc(h.text)}</p></div>`).join('')}</div>
    <h2>${esc(services.heading)}</h2><p>${esc(services.intro)}</p>
    <div class="c-grid">${services.items.map((s) => `<div class="c-card"><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div>`).join('')}</div>
    <h2>${esc(process.heading)}</h2>${process.steps.map((p, i) => `<div class="c-row"><p class="kicker">Step ${i + 1}</p><div><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div></div>`).join('')}
    <h2>${esc(work.heading)}</h2>
    <div class="c-grid">${work.projects.map((p) => `<article class="c-card"><img class="shot" src="${p.image}" alt="${esc(p.name)} preview"><p class="kicker">${esc(p.category)}</p><h3>${esc(p.title)}</h3><p><b>${esc(p.result)}</b></p><p>${esc(p.summary)}</p><ul class="chips">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>${p.url ? `<a class="inline" href="${p.url}" target="_blank" rel="noopener">Visit ${esc(p.urlLabel)} ↗</a>` : ''}</article>`).join('')}</div>
    <h2>${esc(experience.heading)}</h2>${experience.items.map((x) => `<div class="c-row"><p class="kicker">${esc(x.period)}</p><div><h3>${esc(x.role)}, ${esc(x.company)}</h3><p>${esc(x.summary)}</p></div></div>`).join('')}
    <div class="c-row"><p class="kicker">${esc(education.period)}</p><div><h3>${esc(education.degree)}</h3><p>${esc(education.school)}</p></div></div>
    <h2>${esc(stack.heading)}</h2><div class="c-grid">${stack.groups.map((g) => `<div class="c-card"><h3>${esc(g.label)}</h3><ul class="chips">${g.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
    <h2>GitHub</h2><p>${(github.total?.lastYear ?? 0).toLocaleString('en-US')} contributions in the last year across ${esc(github.user.publicRepos)} public repositories.</p>
    <h2>${esc(testimonials.heading)}</h2><div class="c-grid">${testimonials.items.map((t) => `<blockquote class="c-card" style="margin:0"><p class="quote">"${esc(t.quote)}"</p><p><b>${esc(t.name)}</b>, ${esc(t.role)}</p></blockquote>`).join('')}</div>
    <h2>${esc(contact.heading)}</h2><p>${esc(contact.body)}</p>
    ${contactFormHTML('classic')}
    <p class="contact-or">Or reach me directly</p>
    <div style="max-width:520px"><div class="copyline"><span>${esc(profile.email)}</span><button type="button" data-copy="${esc(profile.email)}">Copy</button></div><div class="copyline"><span>${esc(profile.phone)}</span><button type="button" data-copy="${esc(profile.phone)}">Copy</button></div></div>
    <div class="actions"><a class="btn btn-primary" href="${profile.whatsapp}" target="_blank" rel="noopener">Message on WhatsApp ↗</a></div>
    <div class="socials">${socials.map((s) => `<a href="${s.href}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')}</div>
  </div>`;
}

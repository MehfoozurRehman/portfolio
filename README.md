# Portfolio and CV generator

A static, SEO-first personal site where the case studies and the downloadable CV are generated from one content source.

## The problem

Developer portfolios usually end up as either stock templates or heavy single-page apps that are slow to load and hard to keep current. This site is pre-rendered and fast by default. Adding a project means editing one data file: the project gets its own case-study page, a sitemap entry and structured data, and it appears in the index.

## What it does

- **Case-study pages from one data file.** Seven projects in `src/data.ts` each render at `/case-studies/[slug]` with a problem, approach, outcome, stack and links to three related projects.
- **Contact form as an island.** The only React component on the page. It hydrates when visible and sends through EmailJS, configured by environment variables with built-in defaults.
- **GitHub activity without a runtime call.** The contribution graph is fetched at build time and inlined as SVG, so visitors make no third-party request.
- **CV generated as a PDF.** `scripts/generate-cv-pdf.mjs` builds `public/cv.pdf` with PDFKit from structured content in `scripts/cv-content.mjs` on every full build.
- **Search and share metadata.** Per-page title, description, canonical and Open Graph tags, JSON-LD (`Person`, `WebSite`, `CreativeWork`, `BreadcrumbList`), a sitemap, `robots.txt` and a social card.
- **Optimised assets.** Images go through `astro:assets` (AVIF/WebP with responsive `srcset`). Fonts are self-hosted variable fonts.

## How it's built

- **Stack:** Astro 7, React 19 islands, Tailwind CSS v4 through its Vite plugin, TypeScript, PDFKit, pnpm 11, deployed to Firebase Hosting.
- **Static first.** Every page is pre-rendered HTML. Only the contact form ships React. The theme toggle, scroll reveal, navigation and cursor glow are small vanilla TypeScript in `src/scripts/behaviors.ts`.
- **Build-time data, scheduled rebuilds.** The GitHub fetch and the CV both run during `pnpm build`, so the output needs no server. A scheduled workflow rebuilds daily at 03:17 UTC so the activity graph stays current, and pushes to `main` deploy to Firebase Hosting.

## Running it locally

```bash
pnpm install
pnpm dev          # dev server on http://localhost:4321
pnpm build        # regenerates the CV, then builds to dist/
pnpm preview      # serves the production build
```

Other scripts: `pnpm check` (type checks), `pnpm generate:cv`, `pnpm generate:icons`. CI uses Node 24 and pnpm 11.

## What I learned and what I'd do next

- There are no automated tests. Quality is checked by `pnpm check` and the production build. Browser or link checks on the case-study pages would catch regressions the build does not.
- Three service-worker files sit in `public/` (`sw.js`, `service-worker.js`, `firebase-messaging-sw.js`), and nothing in `src/` registers them. Decide whether they are needed, and remove the ones that are not.
- The GitHub activity fetch depends on a third-party API at build time. It returns `null` on error, so confirm the component handles an empty result before relying on it.
- The EmailJS keys are public by design and visible in the client bundle. Rate limits on the EmailJS side are the main protection against spam.

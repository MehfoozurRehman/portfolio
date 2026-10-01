# Developer Portfolio & CV Generator

Personal portfolio of Mehfooz-ur-Rehman, built with **Astro 7**, **React 19 islands**, **Tailwind CSS v4** and a PDFKit-generated CV. Output is fully static and deployed to Firebase Hosting.

## Architecture

- **Static-first**: every page is pre-rendered HTML. Only the contact form ships React (hydrated on `client:visible`); theme toggle, scroll reveal, nav and cursor glow are ~2 KB of vanilla TypeScript (`src/scripts/behaviors.ts`).
- **GitHub contribution graph** is fetched at build time and inlined as SVG (`src/lib/github.ts`), so there is no runtime third-party call. CI rebuilds daily to keep it fresh.
- **Images** go through `astro:assets` (AVIF/WebP, responsive `srcset`, explicit dimensions). Fonts are self-hosted, latin-subset variable fonts, preloaded.
- **SEO**: per-page title/description/canonical/Open Graph, JSON-LD (`Person`, `WebSite`, `CreativeWork`, `BreadcrumbList`), sitemap, `robots.txt`, social card (`public/og.png`).
- **Content** lives in `src/data.ts`; case-study pages are generated from `projects`.

## Structure

```
src/
  pages/            index.astro, case-studies/[slug].astro, 404.astro
  layouts/Base.astro  head, SEO, theme bootstrap
  components/       SiteNav, SectionMarker, GitHubActivity, Logo
  islands/          contact-form.tsx (React)
  scripts/          behaviors.ts (vanilla)
  lib/              site constants, GitHub fetcher
  assets/           optimized images
scripts/            generate-cv-pdf.mjs, generate-icons.mjs
public/             static files (cv.pdf, icons, og.png, manifest, robots)
```

## Commands

| Command | Action |
| --- | --- |
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Generate CV PDF, then build to `dist/` |
| `pnpm build:site` | Build without regenerating the CV |
| `pnpm preview` | Preview the production build |
| `pnpm check` | Type-check `.astro` / `.ts` / `.tsx` |
| `pnpm generate:cv` | Rebuild `public/cv.pdf` |
| `pnpm generate:icons` | Rebuild PWA icons and `og.png` |
| `pnpm deploy` | Build and deploy to Firebase Hosting |

## Configuration

Optional env vars (public, used by the contact form; defaults are built in): `PUBLIC_EMAILJS_PUBLIC_KEY`, `PUBLIC_EMAILJS_SERVICE_ID`, `PUBLIC_EMAILJS_TEMPLATE_ID`, `PUBLIC_CONTACT_EMAIL`.

Requires Node 20+ (CI uses 24) and pnpm 11.

## Author

Created by [Mehfooz-ur-Rehman](https://github.com/MehfoozurRehman).

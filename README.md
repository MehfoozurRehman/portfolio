# Mehfooz-ur-Rehman Portfolio

Premium portfolio for Mehfooz-ur-Rehman, built with Next.js App Router, TypeScript, Tailwind CSS, Convex, and Firebase Hosting.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Convex cloud backend
- Firebase Hosting static export

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm build
```

## Deployment

The site exports to `out` and deploys to Firebase Hosting.

```bash
pnpm build
firebase deploy --only hosting
```

Pushes to `main` also deploy through GitHub Actions using the Firebase service account secret.

## Convex

Production backend:

- Convex app: `mhmd-vision/portfolio`
- Client URL: `https://quixotic-dalmatian-102.convex.cloud`
- HTTP actions URL: `https://quixotic-dalmatian-102.convex.site`
- Lead endpoint: `POST /portfolioLead`

Frontend production env is tracked in `.env.production` because it contains public `NEXT_PUBLIC_*` values only.

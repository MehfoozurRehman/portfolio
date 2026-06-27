# Mehfooz-ur-Rehman Portfolio

Premium portfolio for Mehfooz-ur-Rehman, built with Next.js App Router, TypeScript, Tailwind CSS, and Firebase Hosting.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
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
firebase deploy --only functions --project mehfooz-ur-rehman
firebase deploy --only hosting:mehfooz-ur-rehman --project mehfooz-ur-rehman
```

Deploy locally with the Firebase CLI after logging in from your machine.

## Contact form

The contact form posts to a Firebase HTTPS function at `POST /api/contact`, which sends messages to `mehfoozijaz786@gmail.com` through SMTP.

Set these Firebase secrets before deploying:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

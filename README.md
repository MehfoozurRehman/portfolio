# Developer Portfolio & CV Generator

The personal portfolio, interactive GitHub contributions heatmap, and automated PDF resume generator for Mehfooz-ur-Rehman built with Next.js 16 App Router, React 19, Tailwind CSS v4, and PDFKit.

## Overview

`portfolio` is Mehfooz-ur-Rehman's central web presence highlighting engineering case studies, full-stack open source projects, live GitHub activity visualizers (`react-github-calendar`), automated programmatic PDF curriculum vitae compilation (`pdfkit`), EmailJS contact routing, and Firebase Hosting deployment.

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (v16 App Router)
- **Frontend Core**: React 19, TypeScript
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **PDF Generation**: PDFKit (`pdfkit`, `scripts/generate-cv-pdf.mjs`)
- **Visuals & Heatmaps**: `react-github-calendar`, Lucide Icons
- **Email Service**: `@emailjs/browser`
- **Hosting**: Firebase Hosting (`firebase.json`)

## Prerequisites

- Node.js (v20 or higher recommended)
- Package manager (`pnpm` v11+ recommended)

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Generate CV PDF**:
   ```bash
   pnpm generate:cv
   ```

3. **Run the Development Server**:
   ```bash
   pnpm dev
   ```

4. **Access the Portfolio**:
   Open `http://localhost:3000` in your web browser.

## Available Scripts

- `pnpm dev` - Starts the Next.js development server.
- `pnpm generate:cv` - Builds the PDF resume via PDFKit.
- `pnpm build` - Generates PDF resume and compiles the Next.js production application.
- `pnpm start` - Starts the production server.
- `pnpm deploy` - Builds and deploys directly to Firebase Hosting.

## Author

Created by [Mehfooz-ur-Rehman](https://github.com/MehfoozurRehman).

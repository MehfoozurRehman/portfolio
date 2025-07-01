# Portfolio

A modern, responsive portfolio web application built with React, TypeScript, Vite, and SCSS. This project showcases personal and professional information, including services, work experience, projects, testimonials, and more.

## Features

- **Landing Page:** Eye-catching hero section, about section, and digital identity tagline.
- **Responsive Header:** Navigation links, theme toggle (light/dark), contact button, and mobile menu support.
- **Dashboard:** Modular sections for About, Analytics, Experience, Projects, Settings, Skills, and Testimonials.
- **API Structure:** Organized under `app/api/portfolio/[section]/` for scalable backend/API endpoints.
- **Reusable Components:** Located in `components/` for UI and dashboard elements.
- **Custom Hooks:** Example: `useTheme` for theme management.
- **SCSS Styling:** Modular and responsive styles in `styles/`.
- **Asset Management:** Static assets in `public/` (e.g., profile picture).
- **TypeScript Support:** Type safety across the codebase.

## Project Structure

```
├── app/
│   ├── api/portfolio/[section]/   # API endpoints (REST or mock)
│   └── dashboard/                 # Dashboard sections (about, analytics, etc.)
├── components/                    # Reusable UI and dashboard components
├── data/                          # Static or mock data
├── hooks/                         # Custom React hooks (e.g., useTheme)
├── lib/                           # Utility functions and actions
├── public/                        # Static assets (images, icons)
├── screens/                       # Main page screens (Landing, etc.)
├── styles/                        # SCSS stylesheets
├── index.html                     # Main HTML entry point
├── main.tsx                       # React app entry point
├── router.tsx                     # App routing configuration
├── vite.config.ts                 # Vite configuration
├── tsconfig*.json                 # TypeScript configuration
├── package.json                   # Project metadata and scripts
└── README.md                      # Project documentation
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [pnpm](https://pnpm.io/) (or npm/yarn)

### Installation

```sh
pnpm install
```

### Development

```sh
pnpm dev
```

### Build

```sh
pnpm build
```

### Preview

```sh
pnpm preview
```

## Customization

- **Update content:** Edit files in `screens/`, `components/`, and `data/`.
- **Change styles:** Modify SCSS files in `styles/`.
- **Add sections:** Create new folders/files under `app/dashboard/` and update routing as needed.

## License

This project is open source and available under the [MIT License](LICENSE) (add a LICENSE file if needed).

---

**Author:** Mehfooz-ur-Rehman

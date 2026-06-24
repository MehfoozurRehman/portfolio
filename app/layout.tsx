import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Script from "next/script";
import { ScrollToTopButton } from "./scroll-to-top-button";
import { ServiceWorkerResetScript } from "./sw-reset-script";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Mehfooz-ur-Rehman | Full-stack Product Developer",
  description:
    "Portfolio of Mehfooz-ur-Rehman, a full-stack product developer building web, mobile, desktop and AI-powered business systems.",
  metadataBase: new URL("https://mehfooz-ur-rehman.web.app"),
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/logo.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Mehfooz-ur-Rehman | Full-stack Product Developer",
    description:
      "Web, mobile, desktop, dashboards, automation and AI-powered business systems.",
    url: "https://mehfooz-ur-rehman.web.app",
    siteName: "Mehfooz-ur-Rehman",
    images: [{ url: "/pic.webp", width: 900, height: 900, alt: "Mehfooz-ur-Rehman" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mehfooz-ur-Rehman | Full-stack Product Developer",
    description:
      "Full-stack product developer building web, mobile, desktop and AI-powered business systems.",
    images: ["/pic.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full bg-[#F1EFE5] antialiased`}>
      <body className="flex min-h-full flex-col bg-[#F1EFE5] font-[family-name:var(--font-nunito)]">
        <ServiceWorkerResetScript />
        <Script
          async
          data-collect-dnt="true"
          src="https://scripts.simpleanalyticscdn.com/latest.js"
          strategy="afterInteractive"
        />
        <noscript>
          <img
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
            src="https://queue.simpleanalyticscdn.com/noscript.gif?collect-dnt=true"
          />
        </noscript>
        <ScrollToTopButton />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mehfooz-ur-Rehman | Full-stack Product Developer",
  description:
    "Portfolio of Mehfooz-ur-Rehman, a full-stack product developer building web, mobile, desktop and AI-powered business systems.",
  metadataBase: new URL("https://mehfooz-ur-rehman.web.app"),
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

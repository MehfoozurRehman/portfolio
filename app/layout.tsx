import "../styles/global.scss";

import Footer from "@/components/Footer";
import Header from "@/components/header/Header";
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";

const nunito = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mehfooz-ur-Rehman",
  description: "Mehfooz-ur-Rehman's personal website",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={nunito.className}>
        <Header />
        {children}
        <Footer />
        <SpeedInsights />
      </body>
    </html>
  );
}

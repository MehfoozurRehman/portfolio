import "../styles/global.scss";

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={nunito.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}

import "./global.scss";
import "swiper/scss";
import "swiper/scss/autoplay";

import { Cabin } from "next/font/google";
import type { Metadata } from "next";
import NetworkStatus from "@/components/NetworkStatus";

const cabin = Cabin({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mehfooz-ur-Rehman",
  description: "Mehfooz-ur-Rehman's personal website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cabin.className}>
        <NetworkStatus>{children}</NetworkStatus>
      </body>
    </html>
  );
}

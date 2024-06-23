"use client";

import Footer from "./Footer";
import Header from "./Header";
import Loading from "./Loading";
import { Server } from "react-feather";
import Socials from "./Socials";
import { Suspense } from "react";
import { useIsOnline } from "react-use-is-online";
import { usePathname } from "next/navigation";

export default function NetworkStatus({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isOnline } = useIsOnline();
  const hasWindow = typeof window !== "undefined";

  return (
    <>
      <Suspense fallback={<Loading />}>
        <div className="App">
          <Socials />
          <Header />
          {children}
          {pathname === "/" && <Footer />}
        </div>
      </Suspense>
      {!isOnline && hasWindow && (
        <div className="offline">
          <Server size={40} color="var(--primary)" />
          <div className="offline__heading">Oops! You are offline</div>
        </div>
      )}
    </>
  );
}

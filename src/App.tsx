import { Outlet, useLocation } from "react-router-dom";

import Footer from "./components/Footer";
import Header from "./components/Header";
import Loading from "./components/Loading";
import { Server } from "react-feather";
import Socials from "./components/Socials";
import { Suspense } from "react";
import { useIsOnline } from "react-use-is-online";

export function App() {
  const location = useLocation();
  const { isOnline } = useIsOnline();

  return (
    <>
      {isOnline ? (
        <Suspense fallback={<Loading />}>
          <div className="App">
            <Socials />
            <Header />
            <Outlet />
            {location.pathname === "/" && <Footer />}
          </div>
        </Suspense>
      ) : (
        <div className="offline">
          <Server size={40} color="#64ffda" />
          <div className="offline__heading">Oops! You are offline</div>
        </div>
      )}
    </>
  );
}

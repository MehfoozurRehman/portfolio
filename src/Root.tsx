import "swiper/css";
import "swiper/css/autoplay";
import "./styles.scss";

import { Outlet, useLocation } from "react-router";

import Footer from "./components/footer";
import Header from "./components/header";
import Loading from "./components/loading";
import { Server } from "react-feather";
import Socials from "./components/socials";
import { Suspense } from "react";
import { useIsOnline } from "react-use-is-online";

function Root() {
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

export default Root;

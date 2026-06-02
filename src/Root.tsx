import "swiper/css";
import "swiper/css/autoplay";
import "./styles.scss";

import { Outlet, useLocation } from "react-router";

import Footer from "./components/footer";
import Header from "./components/header";
import Loading from "./components/loading";
import Socials from "./components/socials";
import { Suspense } from "react";

function Root() {
  const location = useLocation();

  return (
    <Suspense fallback={<Loading />}>
      <div className="App">
        <Socials />
        <Header />
        <Outlet />
        {location.pathname === "/" && <Footer />}
      </div>
    </Suspense>
  );
}

export default Root;

import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.scss";
import "swiper/scss";
import Loading from "./components/Loading";
// import { getReferrer } from "./utils/getReferrer";
// import { trackVisits } from "./utils/trackVisits";
const Socials = lazy(() => import("./components/Socials"));
const Header = lazy(() => import("./components/Header"));
const Footer = lazy(() => import("./components/Footer"));
const Home = lazy(() => import("./screens/Home"));
const Archive = lazy(() => import("./screens/Archive"));
const ProjectDetails = lazy(() => import("./screens/ProjectDetails"));

export default function App() {
  const [showFooter, setShowFooter] = useState(false);
  useEffect(() => {
    // console.log(trackVisits());
    // console.log(getReferrer());
    if (window.location.pathname === "/") {
      setShowFooter(true);
    } else {
      setShowFooter(false);
    }
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <div className="App">
        <Socials />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/details/:id" element={<ProjectDetails />} />
          <Route path="*" element={<>404</>} />
        </Routes>
      </div>
      {showFooter ? <Footer /> : null}
    </Suspense>
  );
}

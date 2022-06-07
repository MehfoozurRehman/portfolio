import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.scss";
import Loading from "./components/Loading";
import { getReferrer } from "./utils/getReferrer";
import { trackVisits } from "./utils/trackVisits";
const Socials = lazy(() => import("./components/Socials"));
const Header = lazy(() => import("./components/Header"));
const Footer = lazy(() => import("./components/Footer"));
const Home = lazy(() => import("./screens/Home"));
const Archive = lazy(() => import("./screens/Archive"));

export default function App() {
  useEffect(() => {
    console.log(trackVisits());
    console.log(getReferrer());
  }, []);

  return (
    <Suspense fallback={<Loading />}>
      <div className="App">
        <Socials />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
        </Routes>
      </div>
      <Footer />
    </Suspense>
  );
}

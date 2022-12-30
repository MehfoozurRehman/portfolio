import "./App.scss";

import { Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";

import Archive from "./screens/Archive";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Home from "./screens/Home";
import ProjectDetails from "./screens/ProjectDetails";
import Socials from "./components/Socials";

// import { getReferrer } from "./utils/getReferrer";
// import { trackVisits } from "./utils/trackVisits";

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
    <>
      <div className="App">
        <Socials />
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/details/:id" element={<ProjectDetails />} />
        </Routes>
      </div>
      {showFooter ? <Footer /> : null}
    </>
  );
}

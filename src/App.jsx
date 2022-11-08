import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";

import Socials from "./components/Socials";
import Header from "./components/Header";
import Footer from "./components/Footer";

import ProjectDetails from "./screens/ProjectDetails";
import Archive from "./screens/Archive";
import Home from "./screens/Home";

// import { getReferrer } from "./utils/getReferrer";
// import { trackVisits } from "./utils/trackVisits";

import "./App.scss";

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
          <Route path="*" element={<>404</>} />
        </Routes>
      </div>
      {showFooter ? <Footer /> : null}
    </>
  );
}

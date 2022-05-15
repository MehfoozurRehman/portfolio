import React from "react";
import "./App.scss";
import Socials from "./components/Socials";
import Header from "./components/Header";
import HomeSection from "./components/HomeSection";
import AboutMe from "./components/AboutMe";
import Services from "./components/Services";
import Work from "./components/Work";

export default function App() {
  return (
    <div className="App">
      <Socials />
      <Header />
      <HomeSection />
      <AboutMe />
      <Services />
      <Work />
      {/* Notworthy */}
      {/* Github calender */}
      {/* Clents */}
      {/* Testimonials */}
      {/* Blog */}
      {/* Contact */}
      {/* Footer */}
    </div>
  );
}

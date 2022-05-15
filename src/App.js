import React from "react";
import "./App.scss";
import AboutMe from "./components/AboutMe";
import Header from "./components/Header";
import HomeSection from "./components/HomeSection";
import Services from "./components/Services";
import Socials from "./components/Socials";

export default function App() {
  return (
    <div className="App">
      <Socials />
      <Header />
      <HomeSection />
      <AboutMe />
      <Services />
      {/* Experiance */}
      {/* Portfolio */}
      {/* Notworthy */}
      {/* Github calender */}
      {/* Clents */}
      {/* Blog */}
      {/* Contact */}
      {/* Footer */}
    </div>
  );
}

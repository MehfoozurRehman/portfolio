import React from "react";
import "./App.scss";
import Socials from "./components/Socials";
import Header from "./components/Header";
import HomeSection from "./components/HomeSection";
import AboutMe from "./components/AboutMe";
import Services from "./components/Services";
import Work from "./components/Work";
import NoteWorthyProjects from "./components/NoteWorthyProjects";
import GithubCalender from "./components/GithubCalender";
import Clients from "./components/Clients";
import Blogs from "./components/Blogs";
import Testimonials from "./components/Testimonials";

export default function App() {
  return (
    <div className="App">
      <Socials />
      <Header />
      <HomeSection />
      <AboutMe />
      <Services />
      <Work />
      <NoteWorthyProjects />
      <GithubCalender />
      <Clients />
      <Testimonials />
      <Blogs />
      {/* Contact */}
      {/* Footer */}
    </div>
  );
}

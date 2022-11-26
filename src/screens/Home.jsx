import AboutMe from "../components/AboutMe";
import Contact from "../components/Contact";
import GithubCalender from "../components/GithubCalender";
import HomeSection from "../components/HomeSection";
import NoteWorthyProjects from "../components/NoteWorthyProjects";
import React from "react";
import Services from "../components/Services";
import Testimonials from "../components/Testimonials";
import Work from "../components/Work";

// import Clients from "../components/Clients";

// import Blogs from "../components/Blogs";

export default function Home() {
  return (
    <>
      <HomeSection />
      <AboutMe />
      <Services />
      <Work />
      <NoteWorthyProjects />
      <GithubCalender />
      {/* <Clients /> */}
      <Testimonials />
      {/* <Blogs /> */}
      <Contact />
    </>
  );
}

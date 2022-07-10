import React, { useEffect } from "react";
import HomeSection from "../components/HomeSection";
import AboutMe from "../components/AboutMe";
import Services from "../components/Services";
import Work from "../components/Work";
import NoteWorthyProjects from "../components/NoteWorthyProjects";
import GithubCalender from "../components/GithubCalender";
import Clients from "../components/Clients";
import Blogs from "../components/Blogs";
import Testimonials from "../components/Testimonials";
import Contact from "../components/Contact";

export default function Index({ setShowFooter }) {
  useEffect(() => {
    setShowFooter(true);
  }, []);
  return (
    <>
      <HomeSection />
      <AboutMe />
      <Services />
      <Work />
      <NoteWorthyProjects />
      <GithubCalender />
      <Clients />
      <Testimonials />
      <Blogs />
      <Contact />
    </>
  );
}

import React, { lazy, useEffect } from "react";
import dynamic from "next/dynamic";
const HomeSection = dynamic(() => import("../components/HomeSection"), {
  suspense: true,
});
const AboutMe = dynamic(() => import("../components/AboutMe"), {
  suspense: true,
});
const Services = dynamic(() => import("../components/Services"), {
  suspense: true,
});
const Work = dynamic(() => import("../components/Work"), {
  suspense: true,
});
const NoteWorthyProjects = dynamic(
  () => import("../components/NoteWorthyProjects"),
  {
    suspense: true,
  }
);
const GithubCalender = dynamic(() => import("../components/GithubCalender"), {
  suspense: true,
});
const Clients = dynamic(() => import("../components/Clients"), {
  suspense: true,
});
const Blogs = dynamic(() => import("../components/Blogs"), {
  suspense: true,
});
const Testimonials = dynamic(() => import("../components/Testimonials"), {
  suspense: true,
});
const Contact = dynamic(() => import("../components/Contact"), {
  suspense: true,
});

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

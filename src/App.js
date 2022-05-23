import { lazy, Suspense, useState } from "react";
import "./App.scss";
import Footer from "./components/Footer";
import Loading from "./components/Loading";
const Socials = lazy(() => import("./components/Socials"));
const Header = lazy(() => import("./components/Header"));
const HomeSection = lazy(() => import("./components/HomeSection"));
const AboutMe = lazy(() => import("./components/AboutMe"));
const Services = lazy(() => import("./components/Services"));
const Work = lazy(() => import("./components/Work"));
const NoteWorthyProjects = lazy(() =>
  import("./components/NoteWorthyProjects")
);
const GithubCalender = lazy(() => import("./components/GithubCalender"));
const Clients = lazy(() => import("./components/Clients"));
const Blogs = lazy(() => import("./components/Blogs"));
const Testimonials = lazy(() => import("./components/Testimonials"));
const Contact = lazy(() => import("./components/Contact"));

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
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
        <Contact />
      </div>
      <Footer />
    </Suspense>
  );
}

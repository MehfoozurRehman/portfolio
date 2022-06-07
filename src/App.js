import { lazy, Suspense, useEffect } from "react";
import "./App.scss";
import Loading from "./components/Loading";
import { getReferrer } from "./utils/getReferrer";
import { trackVisits } from "./utils/trackVisits";
const Socials = lazy(() => import("./components/Socials"));
const Header = lazy(() => import("./components/Header"));
const Footer = lazy(() => import("./components/Footer"));
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
  useEffect(() => {
    console.log(trackVisits());
    console.log(getReferrer());
  }, []);

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

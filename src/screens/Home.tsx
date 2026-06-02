import HomeAbout from "../components/home-about";
import HomeContact from "../components/home-contact";
import HomeGithubCalendar from "../components/home-github-calendar";
import HomeHero from "../components/home-hero";
import HomeProjects from "../components/home-projects";
import HomeServices from "../components/home-services";
import HomeTestimonials from "../components/home-testimonials";
import HomeWork from "../components/home-work";

export default function Home() {
  return (
    <>
      <HomeHero />
      <HomeAbout />
      <HomeServices />
      <HomeWork />
      <HomeProjects />
      <HomeGithubCalendar />
      <HomeTestimonials />
      <HomeContact />
    </>
  );
}

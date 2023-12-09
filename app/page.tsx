import About from "@/components/About";
import Contact from "@/components/Contact";
import Experience from "@/components/Experience";
import Jumbotron from "@/components/Jumbotron";
import Testimonials from "@/components/Testimonials";
import Work from "@/components/Work";

export default function Home() {
  return (
    <>
      <Jumbotron />
      <About />
      <Experience />
      <Work />
      <Testimonials />
      <Contact />
    </>
  );
}

import About from "@/components/About";
import Calender from "@/components/Calender";
import Contact from "@/components/Contact";
import Experience from "@/components/Experience";
import Home from "@/components/Home";
import Testimonial from "@/components/Testimonial";
import Work from "@/components/Work";

export default function Root() {
  return (
    <div>
      <Home />
      <About />
      <Experience />
      <Work />
      <Calender />
      <Testimonial />
      <Contact />
    </div>
  );
}

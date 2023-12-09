import About from "@/components/About";
import Contact from "@/components/Contact";
import Experience from "@/components/Experience";
import Jumbotron from "@/components/jumbotron/Jumbotron";
import Testimonials from "@/components/Testimonials";
import Work from "@/components/work/Work";

export default async function Home() {
  const dataFromGithub = await fetch(
    "https://api.github.com/users/mehfoozurrehman"
  ).then((res) => res.json());
  return (
    <>
      <Jumbotron dataFromGithub={dataFromGithub} />
      <About dataFromGithub={dataFromGithub} />
      <Experience />
      <Work />
      <Testimonials />
      <Contact />
    </>
  );
}

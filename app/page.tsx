import About from "@/components/About";
import Contact from "@/components/Contact";
import Experience from "@/components/Experience";
import Footer from "@/components/Footer";
import Header from "@/components/header/Header";
import Jumbotron from "@/components/jumbotron/Jumbotron";
import Testimonials from "@/components/Testimonials";
import Work from "@/components/work/Work";

export default async function Home() {
  const dataFromGithub = await fetch(
    "https://api.github.com/users/mehfoozurrehman",
    {
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
      },
    }
  ).then((res) => res.json());

  return (
    <>
      <Header />
      <Jumbotron dataFromGithub={dataFromGithub} />
      <About dataFromGithub={dataFromGithub} />
      <Experience />
      <Work />
      <Testimonials />
      <Contact />
      <Footer />
    </>
  );
}

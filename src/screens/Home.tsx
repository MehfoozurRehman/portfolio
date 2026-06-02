import type { GithubRepo, GithubUser } from "../types/github";
import useSWR, { preload } from "swr";

import HomeAbout from "../components/home-about";
import HomeContact from "../components/home-contact";
import HomeGithubCalendar from "../components/home-github-calendar";
import HomeHero from "../components/home-hero";
import HomeProjects from "../components/home-projects";
import HomeServices from "../components/home-services";
import HomeTestimonials from "../components/home-testimonials";
import HomeWork from "../components/home-work";
import fetcher from "../utils/fetcher";

const fetchAllRepos = async (): Promise<GithubRepo[]> => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  let allRepos: GithubRepo[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(
      `https://api.github.com/user/repos?sort=updated&per_page=100&page=${page}&visibility=all`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const data: GithubRepo[] = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      hasMore = false;
    } else {
      const filteredRepos = data.filter((repo) => !repo.fork);
      allRepos = [...allRepos, ...filteredRepos];
      page++;
    }
  }

  return allRepos;
};

preload("https://api.github.com/users/MehfoozurRehman", fetcher);
preload("all-repos", fetchAllRepos);

export default function Home() {
  const { data: projects } = useSWR<GithubRepo[]>("all-repos", fetchAllRepos);
  const { data } = useSWR<GithubUser>(
    "https://api.github.com/users/MehfoozurRehman",
    fetcher,
  );

  return (
    <>
      <HomeHero />
      <HomeAbout data={data} />
      <HomeServices />
      <HomeWork />
      <HomeProjects projects={projects} />
      <HomeGithubCalendar />
      <HomeTestimonials />
      <HomeContact />
    </>
  );
}

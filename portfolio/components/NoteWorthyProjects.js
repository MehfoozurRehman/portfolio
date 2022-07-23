import useSWR from "swr";
import { useRouter } from "next/router";
import { fetcher } from "../utils/fetcher";
import ProjectCard from "./ProjectCard";

export default function NoteWorthyProjects({}) {
  const router = useRouter();
  const { data, error } = useSWR(
    "https://api.github.com/users/MehfoozurRehman/repos?per_page=10000",
    fetcher,
    { suspense: true }
  );

  return (
    <section id="projects__section" className="services__section">
      <div className="services__section__header">
        <div className="home__section__sub__heading">
          Other Noteworthy Projects
        </div>
        <div className="home__section__heading">Projects</div>
      </div>
      <div className="services__section__content">
        {error ? (
          <div>failed to load</div>
        ) : (
          data
            ?.filter(
              (item, i) =>
                item.description && item.description.length !== 0 && i <= 8
            )
            .map((item) => <ProjectCard item={item} key={item.id} />)
        )}
      </div>

      <button
        className="home__section__button"
        onClick={() => {
          router.push("/archive");
          setTimeout(() => {
            window.scrollTo({ behavior: "smooth", top: 0 });
          }, 300);
        }}
        style={{ margin: "0em auto", marginTop: "4em" }}
        title="Load more projects"
      >
        Load more
      </button>
    </section>
  );
}

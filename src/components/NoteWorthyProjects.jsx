import useSWR from "swr";
import { useNavigate } from "react-router-dom";
import { fetcher } from "../utils/fetcher";
import ProjectCard from "./ProjectCard";
import { motion } from "framer-motion";

export default function NoteWorthyProjects() {
  const navigate = useNavigate();
  const { data, error } = useSWR(
    "https://api.github.com/users/MehfoozurRehman/repos?per_page=10000&sort=updated",
    fetcher
  );

  return (
    <section id="projects__section" className="services__section">
      <div className="services__section__header">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{
            opacity: 1,
          }}
          className="home__section__sub__heading"
        >
          Other Noteworthy Projects
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{
            opacity: 1,
          }}
          className="home__section__heading"
        >
          Projects
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{
          opacity: 1,
          transition: {
            staggerChildren: 0.5,
          },
        }}
        className="services__section__content"
      >
        {error ? (
          <div>failed to load</div>
        ) : (
          data
            ?.filter((_item, i) => i <= 8)
            ?.map((item) => <ProjectCard item={item} key={item.id} />)
        )}
      </motion.div>

      <button
        className="home__section__button"
        onClick={() => {
          navigate("/archive");
          setTimeout(() => {
            window.scrollTo({ behavior: "smooth", top: 0 });
          }, 300);
        }}
        style={{ margin: "0 auto", marginTop: "4em" }}
        title="Load more projects"
      >
        Load more
      </button>
    </section>
  );
}

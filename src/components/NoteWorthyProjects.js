import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectCard from "./ProjectCard";

export default function NoteWorthyProjects({}) {
  const navigate = useNavigate();
  const [projectsData, setProjectsData] = useState([]);
  useEffect(() => {
    axios
      .get(
        "https://api.github.com/users/MehfoozurRehman/repos?per_page=10000&sort=updated"
      )
      .then((res) => {
        setProjectsData(res.data);
      });
  }, []);
  return (
    <section id="projects__section" className="services__section">
      <div className="services__section__header">
        <div className="home__section__sub__heading">
          Other Noteworthy Projects
        </div>
        <div className="home__section__heading">Projects</div>
      </div>
      <div className="services__section__content">
        {projectsData
          .filter(
            (item, i) =>
              item.description && item.description.length !== 0 && i <= 10
          )
          .map((item) => (
            <ProjectCard item={item} key={item.id} />
          ))}
      </div>

      <button
        className="home__section__button"
        onClick={() => {
          navigate("/archive");
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

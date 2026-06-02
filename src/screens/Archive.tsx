import ProjectCard from "../components/project-card";
import { useGithubRepos } from "../hooks/use-github";

export default function Archive() {
  const { data, isLoading } = useGithubRepos();

  return (
    <section
      id="projects__section"
      className="services__section"
      style={{ marginTop: 0 }}
    >
      <div className="services__section__header">
        <div className="home__section__sub__heading">
          List of all the projects i have done
        </div>
        <div className="home__section__heading">Archive</div>
      </div>
      {isLoading && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            color: "#64ffda",
          }}
        >
          <svg
            style={{ width: "100px", height: "100px" }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 300 150"
          >
            <path
              fill="none"
              stroke="#64ffda"
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray="300 385"
              strokeDashoffset="0"
              d="M275 75c0 31-27 50-50 50-58 0-92-100-150-100-28 0-50 22-50 50s23 50 50 50c58 0 92-100 150-100 24 0 50 19 50 50Z"
            >
              <animate
                attributeName="stroke-dashoffset"
                calcMode="spline"
                dur="2"
                values="685;-685"
                keySplines="0 0 1 1"
                repeatCount="indefinite"
              ></animate>
            </path>
          </svg>
        </div>
      )}
      {data !== undefined && (
        <div className="archive__grid">
          {data.map((item) => (
            <ProjectCard item={item} key={item.id} />
          ))}
        </div>
      )}
    </section>
  );
}

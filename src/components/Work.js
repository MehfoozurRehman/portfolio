import { aida } from "../assets";
import WorkCard from "./WorkCard";

export default function Work({}) {
  const tech = [
    "ReactJS",
    "MongoDB",
    "ExpressJS",
    "NodeJS",
    "Typescript",
    "Graphql",
    "Rest",
  ];
  return (
    <section id="work__section" className="work__section">
      <div className="work__section__header">
        <div className="home__section__sub__heading">
          Some Things I’ve Built
        </div>
        <div className="home__section__heading">Work</div>
      </div>
      <WorkCard
        tech={["ReactJS", "Sass", "Firebase", "Adobe Xd", "Rest"]}
        banner={aida}
        info="A website for startup to help companies and freelancers or jobseekers connect with candidates pre curated for companies according to customized requirements of companies"
        siteLink="https://aida-pro.web.app/"
        githubLink="https://github.com/MehfoozurRehman/Aida-Website"
      />
      <WorkCard
        right
        tech={["ReactJS", "Sass", "Firebase", "Adobe Xd", "Rest"]}
        banner={aida}
        info="A website for startup to help companies and freelancers or jobseekers connect with candidates pre curated for companies according to customized requirements of companies"
        siteLink="https://aida-pro.web.app/"
        githubLink="https://github.com/MehfoozurRehman/Aida-Website"
      />
      <WorkCard
        tech={["ReactJS", "Sass", "Firebase", "Adobe Xd", "Rest"]}
        banner={aida}
        info="A website for startup to help companies and freelancers or jobseekers connect with candidates pre curated for companies according to customized requirements of companies"
        siteLink="https://aida-pro.web.app/"
        githubLink="https://github.com/MehfoozurRehman/Aida-Website"
      />
    </section>
  );
}

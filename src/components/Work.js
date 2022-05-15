import React from "react";
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
      <WorkCard tech={tech} />
      <WorkCard tech={tech} right />
      <WorkCard tech={tech} />
    </section>
  );
}

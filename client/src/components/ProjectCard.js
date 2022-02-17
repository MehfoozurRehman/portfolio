import React from "react";
import { Link } from "react-router-dom";
import { pic } from "../assets";
export default function ProjectCard() {
  return (
    <Link
      to="/project-detail"
      onClick={() => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }}
      className="project__card"
    >
      <div className="project__card__name">Aida Pro</div>
      <div className="project__card__description">
        Lorem ipsum dolor, sit amet consectetur adipisicing elit. Non, totam.
      </div>
      <div className="project__card__languages">
        <div className="project__card__languages__entry">JavaScript</div>
        <div className="project__card__languages__entry">Html</div>
        <div className="project__card__languages__entry">JavaScript</div>
        <div className="project__card__languages__entry">Html</div>
        <div className="project__card__languages__entry">JavaScript</div>
        <div className="project__card__languages__entry">Html</div>
      </div>
      <img src={pic} alt="" className="project__card__image" />
    </Link>
  );
}

import React from "react";
import { ProjectCard } from "../components";

export default function ProjectDetails() {
  return (
    <>
      <div className="screen__header">
        <div className="screen__header__left">
          <div className="screen__header__name">Project Details</div>
          <div className="screen__header__breadcrum">
            <div className="screen__header__breadcrum__bar"></div> Home /
            Project Details
          </div>
        </div>
        <div className="screen__header__left__right"></div>
      </div>
      <div className="portfolio__projects">
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
      </div>
      <div className="porfolio__loadmore">
        <button className="contact__section__right__btn">Load More</button>
      </div>
    </>
  );
}

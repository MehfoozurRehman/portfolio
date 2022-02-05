import React from "react";
import { PortfolioFilter, ProjectCard } from "../components";

export default function Portfolio() {
  return (
    <>
      <div className="screen__header">
        <div className="screen__header__left">
          <div className="screen__header__name">Portfolio</div>
          <div className="screen__header__breadcrum">
            <div className="screen__header__breadcrum__bar"></div> Home /
            Portfolio
          </div>
        </div>
        <div className="screen__header__right">
          <div className="portfolio__filters">
            <PortfolioFilter defaultChecked={true}>All</PortfolioFilter>
            <PortfolioFilter>Web App</PortfolioFilter>
            <PortfolioFilter>Mobile App</PortfolioFilter>
            <PortfolioFilter>UI/UX Design</PortfolioFilter>
          </div>
        </div>
      </div>
      <div className="portfolio__projects">
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
        <ProjectCard />
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

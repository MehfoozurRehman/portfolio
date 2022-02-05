import React from "react";
import { Link } from "react-router-dom";
import { pic } from "../assets";
function ProjectCard() {
  return (
    <Link to="/project-details" className="project__card">
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

function PortfolioFilters({ children, defaultChecked, onClick }) {
  return (
    <div className="header__wrapper__nav__link">
      <input
        type="radio"
        defaultChecked={defaultChecked}
        className="header__wrapper__nav__link__input"
        name="portfolio__filters__input"
        onClick={onClick}
      />
      <div className="header__wrapper__nav__link__content">{children}</div>
    </div>
  );
}
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
            <PortfolioFilters defaultChecked={true}>All</PortfolioFilters>
            <PortfolioFilters>Web App</PortfolioFilters>
            <PortfolioFilters>Mobile App</PortfolioFilters>
            <PortfolioFilters>UI/UX Design</PortfolioFilters>
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
        <button className="contact__section__right__btn">Send</button>
      </div>
    </>
  );
}

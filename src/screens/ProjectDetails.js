import React from "react";
import { ProjectCard } from "../components";
import { pic } from "../assets";
import { ArrowRight, ArrowUpRight } from "react-feather";

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
      <div className="project__section">
        <div className="project__section__left">
          <div className="project__section__left__heading">Project Brief:</div>
          <div className="project__section__left__info">
            Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repellat,
            rerum vitae dolorem porro nisi neque consequatur quas, earum sed
            itaque quasi odit. Porro consequuntur fuga labore nihil sed facere
            voluptatum.
          </div>
          <div className="project__section__left__bar"></div>
          <div className="project__section__left__heading">
            Project Detials:
          </div>
          <div className="project__section__left__about">
            <span>Category:</span> App Design
          </div>
          <div className="project__section__left__about">
            <span>Date:</span> 01 January, 2021
          </div>
          <div className="project__section__left__about">
            <span>Client:</span> DSME Global
          </div>
          <div className="project__section__left__link">
            <a href="#" className="project__section__left__link__entry">
              Launch Project
              <ArrowRight size={20} color="currentColor" />
            </a>
          </div>
        </div>
        <img src={pic} alt="pic" className="project__section__right" />
      </div>
      <div className="project__section" style={{ marginBottom: 0 }}>
        <div className="project__section__left">
          <div className="project__section__left__heading">
            Related Projects
          </div>
        </div>
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

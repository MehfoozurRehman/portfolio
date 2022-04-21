import axios from "axios";
import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "react-feather";

function PortfolioFilter({ label }) {
  return (
    <div className="portfolio__section__header__middle__entry">
      <input
        type="radio"
        name="portfolio__section__header__middle__entry"
        className="portfolio__section__header__middle__entry__input"
      />
      <div className="portfolio__section__header__middle__entry__content">
        {label}
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [projectsData, setProjectsData] = useState([]);
  useEffect(() => {
    axios
      .get("https://api.github.com/users/MehfoozurRehman/repos")
      .then((res) => {
        setProjectsData(res.data);
        console.log(res.data);
      });
  }, []);

  return (
    <div id="portfolio__section" className="portfolio__section">
      <PortfolioHeader />
      <div className="portfolio__section__content"></div>
    </div>
  );
}

function PortfolioHeader({}) {
  return (
    <div className="portfolio__section__header">
      <div className="portfolio__section__header__left">
        <div className="portfolio__section__header__left__sub__heading">
          Some of my recent work
        </div>
        <div className="portfolio__section__header__left__heading">
          Portfolio
        </div>
      </div>
      <div className="portfolio__section__header__middle">
        <PortfolioFilter label="All" />
        <PortfolioFilter label="Web Dev" />
        <PortfolioFilter label="Mobile" />
        <PortfolioFilter label="UI/UX Design" />
      </div>
      <div className="portfolio__section__header__right">
        <button className="portfolio__section__header__right__button">
          <ArrowLeft size={20} color="currentColor" />
        </button>
        <button className="portfolio__section__header__right__button">
          <ArrowRight size={20} color="currentColor" />
        </button>
      </div>
    </div>
  );
}

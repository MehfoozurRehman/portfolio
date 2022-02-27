import axios from "axios";
import React, { useEffect, useState } from "react";
import { PortfolioFilter, ProjectCard } from "../components";

export default function Portfolio() {
  const [limit, setLimit] = useState(6);
  const [portfolioData, setPortfolioData] = useState([]);
  useEffect(() => {
    axios
      .get("http://localhost:9000/api/v1/get_project")
      .then((res) => {
        setPortfolioData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

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
        {portfolioData
          .filter((item, i) => i < limit)
          .map((data, i) => (
            <ProjectCard data={data} key={i} />
          ))}
      </div>
      <div className="porfolio__loadmore">
        <button
          title="load more"
          className="contact__section__right__btn"
          onClick={() => {
            setLimit(limit + limit);
          }}
        >
          Load More
        </button>
      </div>
    </>
  );
}

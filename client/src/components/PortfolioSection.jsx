import axios from "axios";
import React, { useState } from "react";
import { useEffect } from "react";
import { ArrowRight } from "react-feather";
import { Link } from "react-router-dom";
import { PortfolioFilter, ProjectCard } from "../components";

export default function PortfolioSection() {
  const [filter, setFilter] = useState("");
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
      <div className="portfolio__section__header">
        <div className="portfolio__section__left">
          <div className="services__section__right__sub__heading">
            <div className="services__section__right__sub__heading__bar"></div>
            Portfolio
          </div>
          <div
            className="services__section__right__heading"
            style={{ marginBottom: 0 }}
          >
            Some of my distinguished woks
          </div>
        </div>
        <div className="portfolio__section__right">
          <div className="portfolio__filters">
            <PortfolioFilter
              onClick={() => {
                setFilter("");
              }}
              defaultChecked={true}
            >
              All
            </PortfolioFilter>
            <PortfolioFilter
              onClick={() => {
                setFilter("Web App");
              }}
            >
              Web App
            </PortfolioFilter>
            <PortfolioFilter
              onClick={() => {
                setFilter("Mobile App");
              }}
            >
              Mobile App
            </PortfolioFilter>
            <PortfolioFilter
              onClick={() => {
                setFilter("UI/UX Design");
              }}
            >
              UI/UX Design
            </PortfolioFilter>
          </div>
        </div>
      </div>
      <div className="portfolio__projects">
        {portfolioData
          .filter((item, i) =>
            filter === "" ? i < 6 : i < 6 && item.category === filter
          )
          .map((data, i) => (
            <ProjectCard data={data} key={i} />
          ))}
      </div>
      <div
        className="project__section__left__link"
        style={{
          width: "100%",
          maxWidth: "1440px",
          margin: "0em auto",
          padding: "0em 2em",
          marginTop: "1em",
          marginBottom: "6em",
        }}
      >
        <Link
          to="/portfolio"
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
            document.getElementById("portfolio").checked = true;
          }}
          className="project__section__left__link__entry"
          style={{ marginTop: "0em" }}
        >
          View More
          <ArrowRight size={20} color="currentColor" />
        </Link>
      </div>
    </>
  );
}

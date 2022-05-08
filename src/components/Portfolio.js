import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "react-feather";
import Fade from "react-reveal/Fade";
import { Swiper, SwiperSlide } from "swiper/react";
import axios from "axios";
import PortfolioFilter from "./PortfolioFilter";
import ProjectCard from "./ProjectCard";

export default function Portfolio() {
  const [filters, setFilters] = useState("");
  const [perView, setPerView] = useState(4);
  const [projectsData, setProjectsData] = useState([]);
  function windowSize() {
    if (window.innerWidth <= 550) {
      setPerView(1);
    } else if (window.innerWidth <= 650) {
      setPerView(1.4);
    } else if (window.innerWidth <= 780) {
      setPerView(1.5);
    } else if (window.innerWidth <= 900) {
      setPerView(2);
    } else if (window.innerWidth <= 1000) {
      setPerView(2.2);
    } else if (window.innerWidth <= 1150) {
      setPerView(2.5);
    } else if (window.innerWidth <= 1360) {
      setPerView(3);
    } else if (window.innerWidth <= 1440) {
      setPerView(3.5);
    } else {
      setPerView(3.5);
    }
  }
  useEffect(() => {
    axios
      .get(
        "https://api.github.com/users/MehfoozurRehman/repos?per_page=10000&sort=updated"
      )
      .then((res) => {
        setProjectsData(res.data);
      });
    windowSize();
    window.addEventListener("resize", windowSize);
  }, []);
  return (
    <div id="portfolio__section" className="portfolio__section section">
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
          <PortfolioFilter
            defaultChecked={true}
            label="All"
            onClick={() => {
              setFilters("");
            }}
          />
          <PortfolioFilter
            label="Web App"
            onClick={() => {
              setFilters("web");
            }}
          />
          <PortfolioFilter
            label="Mobile App"
            onClick={() => {
              setFilters("mobile");
            }}
          />
        </div>
        <div className="portfolio__section__header__right">
          <button
            className="portfolio__section__header__right__button"
            id="swiper-back"
            title="swiper-back"
          >
            <ArrowLeft size={20} color="currentColor" />
          </button>
          <button
            className="portfolio__section__header__right__button"
            id="swiper-forward"
            title="swiper-forward"
          >
            <ArrowRight size={20} color="currentColor" />
          </button>
        </div>
      </div>
      <div className="portfolio__section__content">
        <Swiper
          initialSlide={4}
          lazy={true}
          slidesPerView={perView}
          loop={true}
        >
          {projectsData
            .filter((item) =>
              filters === ""
                ? item && item.description && item.description !== null
                : filters === "web"
                ? item.homepage &&
                  item.homepage !== null &&
                  item.description &&
                  item.description !== null
                : filters === "mobile"
                ? !item.homepage &&
                  item.description &&
                  item.description !== null
                : null
            )
            .map((item) => (
              <SwiperSlide key={item.id}>
                <Fade>
                  <ProjectCard item={item} />
                </Fade>
              </SwiperSlide>
            ))}
        </Swiper>
      </div>
    </div>
  );
}

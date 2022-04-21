import axios from "axios";
import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, GitHub, Globe, Layers } from "react-feather";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import "swiper/scss";
import "swiper/scss/navigation";
import "swiper/scss/pagination";

function PortfolioFilter({ label, defaultChecked }) {
  return (
    <div className="portfolio__section__header__middle__entry">
      <input
        type="radio"
        name="portfolio__section__header__middle__entry"
        className="portfolio__section__header__middle__entry__input"
        defaultChecked={defaultChecked}
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
      .get("https://api.github.com/users/MehfoozurRehman/repos?per_page=10000")
      .then((res) => {
        setProjectsData(res.data);
        console.log(res.data);
      });
  }, []);
  const swiper = useSwiper();
  return (
    <div id="portfolio__section" className="portfolio__section">
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
          <PortfolioFilter defaultChecked={true} label="All" />
          <PortfolioFilter label="Web App" />
          <PortfolioFilter label="Mobile App" />
          <PortfolioFilter label="UI/UX Design" />
        </div>
        <div className="portfolio__section__header__right">
          <button
            className="portfolio__section__header__right__button"
            id="swiper-back"
          >
            <ArrowLeft size={20} color="currentColor" />
          </button>
          <button
            className="portfolio__section__header__right__button"
            id="swiper-forward"
          >
            <ArrowRight size={20} color="currentColor" />
          </button>
        </div>
      </div>
      <div className="portfolio__section__content">
        <Swiper
          navigation={{ nextEl: "#swiper-forward", prevEl: "#swiper-back" }}
        >
          {projectsData
            // .filter((item) => item.homepage === "helloworld")
            .map((item) => (
              <SwiperSlide key={item.id}>
                <div className="portfolio__section__content__entry">
                  <div className="portfolio__section__content__entry__heading">
                    <Layers size={30} color="currentColor" />
                    <span>
                      {item.name.replace(/-/g, " ").replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="portfolio__section__content__entry__info">
                    {item.description && item.description.lengh > 50
                      ? item.description.substring(1, 50)
                      : item.description}
                  </div>
                  <div className="portfolio__section__content__entry__content">
                    {item.language}
                  </div>
                  <div className="portfolio__section__content__entry__buttons">
                    <a
                      href={item.html_url}
                      className="portfolio__section__content__entry__button"
                    >
                      <GitHub size={20} color="currentColor" />
                      Github
                    </a>
                    {item.homepage !== null ? (
                      <a
                        href={item.homepage}
                        className="portfolio__section__content__entry__button"
                      >
                        <Globe size={20} color="currentColor" />
                        Website
                      </a>
                    ) : null}
                  </div>
                </div>
              </SwiperSlide>
            ))}
        </Swiper>
      </div>
    </div>
  );
}

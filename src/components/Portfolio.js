import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  GitHub,
  Globe,
  Layout,
} from "react-feather";
import { Fade } from "react-reveal";
import { Swiper, SwiperSlide } from "swiper/react";

function PortfolioFilter({ label, defaultChecked, onClick }) {
  return (
    <div className="portfolio__section__header__middle__entry">
      <input
        type="radio"
        name="portfolio__section__header__middle__entry"
        className="portfolio__section__header__middle__entry__input"
        defaultChecked={defaultChecked}
        onClick={onClick}
      />
      <div className="portfolio__section__header__middle__entry__content">
        {label}
      </div>
    </div>
  );
}

export default function Portfolio() {
  const [filters, setFilters] = useState("");
  const [perView, setPerView] = useState(4);
  const [projectsData, setProjectsData] = useState([]);
  useEffect(() => {
    axios
      .get(
        "https://api.github.com/users/MehfoozurRehman/repos?per_page=10000&sort=updated"
      )
      .then((res) => {
        setProjectsData(res.data);
        console.log(res.data);
      });
    if (window.innerWidth <= 400) {
      setPerView(1);
    } else if (window.innerWidth <= 550) {
      setPerView(2);
    } else if (window.innerWidth <= 900) {
      setPerView(3);
    } else if (window.innerWidth <= 1360) {
      setPerView(4);
    } else if (window.innerWidth <= 1440) {
      setPerView(4);
    } else {
      setPerView(4);
    }
    window.addEventListener("resize", () => {
      if (window.innerWidth <= 400) {
        setPerView(1);
      } else if (window.innerWidth <= 550) {
        setPerView(1);
      } else if (window.innerWidth <= 900) {
        setPerView(2);
      } else if (window.innerWidth <= 1360) {
        setPerView(4);
      } else if (window.innerWidth <= 1440) {
        setPerView(4);
      } else {
        setPerView(4);
      }
    });
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
        <Swiper initialSlide={4} slidesPerView={perView} loop={true}>
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
            .map((item, i) => {
              console.log(item);
              return (
                <SwiperSlide key={item.id}>
                  <Fade>
                    <div className="portfolio__section__content__entry">
                      <div className="portfolio__section__content__entry__heading">
                        {item.homepage && item.homepage !== null ? (
                          <Layout size={30} color="currentColor" />
                        ) : (
                          <Box size={30} color="currentColor" />
                        )}

                        <span>
                          {item.name.replace(/-/g, " ").replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="portfolio__section__content__entry__info">
                        {item.description && item.description.length > 180
                          ? item.description.substring(1, 180) + "..."
                          : item.description}
                      </div>
                      <div className="portfolio__section__content__entry__content">
                        {item.language !== null ? item.language : "HTML"}
                      </div>
                      <div className="portfolio__section__content__entry__buttons">
                        <a
                          href={item.html_url}
                          className="portfolio__section__content__entry__button"
                        >
                          <GitHub size={20} color="currentColor" />
                          Github
                        </a>
                        {item.homepage && item.homepage !== null ? (
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
                  </Fade>
                </SwiperSlide>
              );
            })}
        </Swiper>
      </div>
    </div>
  );
}

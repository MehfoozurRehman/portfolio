import React from "react";
import {
  Facebook,
  Feather,
  GitHub,
  Instagram,
  Linkedin,
  Play,
} from "react-feather";
import { Link } from "react-router-dom";
import { profile } from "../assets";

export default function HomeSection({ info }) {
  return (
    <section className="home__section" id="home__section">
      <div className="home__section__left">
        <div className="services__section__right__sub__heading">
          <div className="services__section__right__sub__heading__bar"></div>
          HEY I'M {info.name}
        </div>
        <div className="home__section__left__heading">{info.slogan}</div>
        <div className="home__section__left__info">{info.role}</div>
        <div className="home__section__left__buttons">
          <Link
            to="/contact"
            onClick={() => {
              document.getElementById("contact").checked = true;
            }}
            className="home__section__left__buttons__primary"
          >
            Hire me
          </Link>
          <Link
            to="/portfolio"
            onClick={() => {
              document.getElementById("portfolio").checked = true;
            }}
            className="home__section__left__buttons__secondary"
          >
            Check Out My work
          </Link>
        </div>
      </div>
      <div className="home__section__right">
        <button title="play" className="home__section__right__play__button">
          <Play size={20} color="currentColor" fill="currentColor" />
        </button>
        <div className="home__section__right__experience">
          <Feather size={20} color="currentColor" />
          <div className="home__section__right__experience__content">
            <div className="home__section__right__experience__content__heading">
              Experience
            </div>
            <div className="home__section__right__experience__content__info">
              <span>1.5</span>Year
            </div>
          </div>
        </div>
        <div className="home__section__overlay">
          <a
            href="https://github.com/MehfoozurRehman"
            className="home__section__overlay__link"
          >
            <GitHub size={20} color="currentColor" />
          </a>
          <a
            href="https://web.facebook.com/MehfoozurRehmanIjaz/"
            className="home__section__overlay__link"
          >
            <Facebook size={20} color="currentColor" />
          </a>
          <a
            href="https://www.instagram.com/mehfoozurrehman___/"
            className="home__section__overlay__link"
          >
            <Instagram size={20} color="currentColor" />
          </a>
          <a
            href="https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/"
            className="home__section__overlay__link"
          >
            <Linkedin size={20} color="currentColor" />
          </a>
        </div>
        <img src={profile} alt="pic" />
      </div>
    </section>
  );
}

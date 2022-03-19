import React from "react";
import { Link } from "react-router-dom";
import { pic } from "../assets";

export default function AboutSection() {
  return (
    <section className="about__section" id="about__section">
      <div className="about__section__left">
        <div className="services__section__right__sub__heading">
          <div className="services__section__right__sub__heading__bar"></div>
          About Us
        </div>
        <div className="services__section__right__heading">
          <span>Hey, Im here</span>
          <span>to help your next project</span>
        </div>
        <div
          className="services__section__right__info"
          style={{ marginBottom: "1em" }}
        >
          I'm a Web Developer and UI/UX Designer from Samundri, Pakistan,
          working in web development. I enjoy turning complex problems into
          simple, beautiful and intuitive solutions.
        </div>
        <div className="services__section__right__info">
          My job is to build functional and user-friendly and at the same time
          attractive websites for you. Moreover, I add a personal touch to your
          product and make sure that it is eye-catching and easy to use. My aim
          is to bring across your message and identity in the most creative way.
        </div>
        <div className="home__section__left__buttons" style={{ marginTop: 40 }}>
          <Link
            to="/portfolio"
            onClick={() => {
              document.getElementById("portfolio").checked = true;
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="home__section__left__buttons__primary"
          >
            My Portfolio
          </Link>
          <a
            href="http://www.africau.edu/images/default/sample.pdf"
            className="home__section__left__buttons__secondary"
          >
            Download CV
          </a>
        </div>
      </div>
      <div className="about__section__right">
        <div className="about__section__right__box">
          <img
            src={pic}
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
        <div className="about__section__right__box">
          <img
            src={pic}
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
        <div className="about__section__right__box">
          <img
            src={pic}
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
        <div className="about__section__right__box">
          <img
            src={pic}
            alt="pic"
            className="about__section__right__box__img"
          />
        </div>
      </div>
    </section>
  );
}

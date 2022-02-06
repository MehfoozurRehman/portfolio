import React from "react";
import {
  ArrowRight,
  Facebook,
  Feather,
  GitHub,
  Instagram,
  Linkedin,
  Play,
} from "react-feather";
import { Link } from "react-router-dom";
import { pic, CV } from "../assets";
import { PortfolioFilter, ProjectCard } from "../components";

function ServicesCard({ name, icon }) {
  return (
    <div className="service__card">
      {icon}
      <div className="service__card__heading">{name}</div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="home__section" id="home__section">
        <div className="home__section__left">
          <div className="services__section__right__sub__heading">
            <div className="services__section__right__sub__heading__bar"></div>
            HEY I'M MEHFOOZ-UR-REHMAN
          </div>
          <div className="home__section__left__heading">
            <span>Let's Build You A</span>
            <span>Digital Identity</span>
          </div>
          <div className="home__section__left__info">
            Web Developer & UI/UX Designer
          </div>
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
          <button className="home__section__right__play__button">
            <Play size={20} color="currentColor" fill="currentColor" />
          </button>
          <div className="home__section__right__experience">
            <Feather size={20} color="currentColor" />
            <div className="home__section__right__experience__content">
              <div className="home__section__right__experience__content__heading">
                Experience
              </div>
              <div className="home__section__right__experience__content__info">
                <span>1</span>Year
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
          <img src={pic} alt="pic" />
        </div>
      </section>
      <section className="services__section" id="services__section">
        <div className="services__section__left">
          <div className="services__section__left__col">
            <ServicesCard
              icon={<Feather size={40} color="currentColor" />}
              name="Web Development"
            />
            <ServicesCard
              icon={<Feather size={40} color="currentColor" />}
              name="Mobile Development"
            />
          </div>
          <div className="services__section__left__col">
            <ServicesCard
              icon={<Feather size={40} color="currentColor" />}
              name="UI / UX Design"
            />
          </div>
        </div>
        <div className="services__section__right">
          <div className="services__section__right__sub__heading">
            <div className="services__section__right__sub__heading__bar"></div>
            What I do
          </div>
          <div className="services__section__right__heading">
            <span>Better design,</span>
            <span>Better experiences</span>
          </div>
          <div className="services__section__right__info">
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. Accusamus,
            eos doloremque. Autem ipsa aliquid quia. Quibusdam quo tenetur,
            illum veritatis similique possimus fugiat molestias ut porro
            aspernatur corporis commodi eligendi.
          </div>
        </div>
      </section>
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
            attractive websites for you. Moreover, I add a personal touch to
            your product and make sure that it is eye-catching and easy to use.
            My aim is to bring across your message and identity in the most
            creative way.
          </div>
          <div
            className="home__section__left__buttons"
            style={{ marginTop: 40 }}
          >
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
            <a href={CV} className="home__section__left__buttons__secondary">
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
            <PortfolioFilter defaultChecked={true}>All</PortfolioFilter>
            <PortfolioFilter>Web App</PortfolioFilter>
            <PortfolioFilter>Mobile App</PortfolioFilter>
            <PortfolioFilter>UI/UX Design</PortfolioFilter>
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
          }}
          className="project__section__left__link__entry"
          style={{ marginTop: "0em" }}
        >
          View More
          <ArrowRight size={20} color="currentColor" />
        </Link>
      </div>
      <section className="testimonals__section" id="testimonals__section">
        <div className="services__section__right__sub__heading">
          <div className="services__section__right__sub__heading__bar"></div>
          Testimonals
        </div>
        <div className="services__section__right__heading">
          What clients say
        </div>
        <div className="testimonals__section__content"></div>
      </section>
    </>
  );
}

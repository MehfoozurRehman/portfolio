import React from "react";
import { ArrowRight, Feather } from "react-feather";
import { Link } from "react-router-dom";
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
      <section className="home__section" id="home__section"></section>
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
        <div className="about__section__left"></div>
        <div className="about__section__right"></div>
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
      <section
        className="testimonals__section"
        id="testimonals__section"
      ></section>
    </>
  );
}

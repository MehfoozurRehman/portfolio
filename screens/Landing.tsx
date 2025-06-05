import "../styles/landing.scss";

import { Globe, Layout, Menu, Moon, PhoneOutgoing, Smartphone, Sun, X } from "react-feather";
import { Link, useLocation } from "react-router";

const headerLinks = ["services", "works", "experiences", "testimonials"];

function Header() {
  const location = useLocation();

  return (
    <div className="landing__container__header">
      <div className="landing__container__header__content">
        <Link to="/" className="landing__container__header__content__logo">
          Mehfooz ur Rehman
        </Link>

        <div className="landing__container__header__content__links">
          {headerLinks.map((link) => {
            const isActive = location.hash === "#" + link;

            return (
              <Link key={link} to={"#" + link} className="landing__container__header__content__links__link">
                {isActive && <span>{"< "}</span>}
                {link}
                {isActive && <span>{" >"}</span>}
              </Link>
            );
          })}
        </div>
        <div className="landing__container__header__content__actions">
          <div className="landing__container__header__content__actions__entry">
            <Link to="/contact" className="landing__container__header__content__actions__entry__link">
              +92 313 7178074
            </Link>
            <PhoneOutgoing size={20} color="currentColor" />
          </div>
          <div className="landing__container__header__content__actions__entry">
            <Link to="/contact" className="landing__container__header__content__actions__entry__link">
              Contact
            </Link>
          </div>
          <div className="landing__container__header__content__actions__entry">
            <Moon size={20} color="currentColor" />
            <Sun size={20} color="currentColor" />
          </div>
          <div className="landing__container__header__content__actions__entry special">
            <Menu size={20} color="currentColor" />
            <X size={20} color="currentColor" />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <div className="landing__container__hero">
      <div className="landing__container__hero__title">
        Hi, i am
        <span>Mefooz-ur-Rehman</span>
      </div>
      <div className="landing__container__hero__experience">
        <span>5+</span>
        Years of Experience
      </div>
      <img src="/pic.png" alt="mehfooz ur rehman picture" className="landing__container__hero__img" />
      <div className="landing__container__hero__tagline">Let's Build Your Digital Identity</div>
      <div className="landing__container__hero__intro">
        I'm a Web Developer based in Pakistan. Proficient in web and mobile development. I enjoy turning complex problems into simple, beautiful and intuitive solutions. Working at this time for{" "}
        <Link to="https://www.devscot.com" target="_blank" className="landing__container__hero__intro__link">
          Devscot
        </Link>
      </div>
    </div>
  );
}

const aboutEntries = [
  {
    title: "Web Development",
    number: "01",
    icon: <Layout size={40} color="currentColor" />,
  },
  {
    title: "Mobile Development",
    number: "02",
    icon: <Smartphone size={40} color="currentColor" />,
  },
  {
    title: "Open Source",
    number: "03",
    icon: <Globe size={40} color="currentColor" />,
  },
];

function About() {
  return (
    <div className="landing__container__about">
      <div className="landing__container__about__left">
        {aboutEntries.map((entry) => (
          <div className="landing__container__about__left__entry">
            <div className="landing__container__about__left__entry__icon">{entry.icon}</div>
            <div className="landing__container__about__left__entry__content">
              <div className="landing__container__about__left__entry__content__title">{entry.title}</div>
              <div className="landing__container__about__left__entry__content__number">{entry.number} Projects</div>
            </div>
          </div>
        ))}
      </div>
      <div className="landing__container__about__right">
        <div className="landing__container__about__right__title">About Me</div>
        <div className="landing__container__about__right__info">
          I'm a Web Developer based in Pakistan. I enjoy turning complex problems into simple, beautiful and intuitive solutions.
          <br />I like to build functional and user-friendly and at the same time attractive websites for you. Moreover, I add a personal touch to your product and make sure that it is eye-catching
          and easy to use. My aim is to bring across your message and identity in the most creative way.
        </div>
        <div className="landing__container__about__right__stats">
          <div className="landing__container__about__right__stats__entry">
            <span>250+</span>
            Projects
          </div>
          <div className="landing__container__about__right__stats__entry">
            <span>5+</span>
            Clients
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="landing__container">
      <Header />
      <HeroSection />
      <About />
    </div>
  );
}

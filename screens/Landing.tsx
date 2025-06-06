import "../styles/landing.scss";

import { Globe, Layout, Menu, Moon, PhoneOutgoing, Smartphone, Sun, X } from "react-feather";
import { Link, useLocation } from "react-router";
import { useEffect, useRef, useState } from "react";

import useTheme from "../hooks/useTheme";

const headerLinks = ["services", "works", "experiences", "testimonials"];

function useToggleMenu() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isMenuOpen, setMenuOpen] = useState(true);

  useEffect(() => {
    const handleResizeWindow = () => {
      const isSmallScreen = window.innerWidth < 1250;
      if (isSmallScreen) {
        setMenuOpen(false);
      } else {
        setMenuOpen(true);
      }
    };

    handleResizeWindow();

    window.addEventListener("resize", handleResizeWindow);

    return () => {
      window.removeEventListener("resize", handleResizeWindow);
    };
  }, []);

  useEffect(() => {
    if (window.innerWidth > 1250) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  return { menuRef: containerRef, isMenuOpen, toggleMenu };
}

function Header() {
  const location = useLocation();

  const { theme, toggleTheme } = useTheme();

  const { menuRef, isMenuOpen, toggleMenu } = useToggleMenu();

  return (
    <div className="landing__container__header">
      <div className="landing__container__header__content">
        <Link to="/" className="landing__container__header__content__logo">
          Mehfooz ur Rehman
        </Link>
        {isMenuOpen && (
          <div ref={menuRef} className="landing__container__header__content__links">
            {headerLinks.map((link) => {
              const isActive = location.hash === "#" + link;

              return (
                <Link key={link} to={"#" + link} className="landing__container__header__content__links__link">
                  {isActive && <span>{"( "}</span>}
                  {link}
                  {isActive && <span>{" )"}</span>}
                </Link>
              );
            })}
          </div>
        )}
        <div className="landing__container__header__content__actions">
          <div className="landing__container__header__content__actions__entry">
            <Link to="tel:+923137178074" className="landing__container__header__content__actions__entry__link">
              +92 313 7178074
            </Link>
            <PhoneOutgoing size={18} color="currentColor" />
          </div>
          <div className="landing__container__header__content__actions__entry">
            <Link to="#contact" className="landing__container__header__content__actions__entry__contact">
              Contact
            </Link>
          </div>
          <button onClick={() => toggleTheme()} className="landing__container__header__content__actions__entry button">
            {theme === "light" ? <Moon size={20} color="currentColor" /> : <Sun size={20} color="currentColor" />}
          </button>
          <button onClick={() => toggleMenu()} className="landing__container__header__content__actions__entry button special">
            {isMenuOpen ? <X size={20} color="currentColor" /> : <Menu size={20} color="currentColor" />}
          </button>
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
          <div key={entry.title} className="landing__container__about__left__entry">
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

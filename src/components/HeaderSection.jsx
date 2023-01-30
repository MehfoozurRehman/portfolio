import { Facebook, GitHub, Mail, Menu } from "react-feather";
import { useEffect, useState } from "react";

import ClickAwayListener from "react-click-away-listener";
import { Fade } from "react-reveal";
import clsx from "clsx";

export default function HeaderSection() {
  const [active, setActive] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth > 1000);
  const [isMenuInteracted, setIsMenuInteracted] = useState(false);

  const handleClickAway = () => {
    if (window.innerWidth < 1000 && !isMenuInteracted) setIsMenuOpen(false);
  };

  useEffect(() => {
    window.addEventListener("resize", () => {
      if (window.innerWidth > 1000) setIsMenuOpen(true);
      else setIsMenuOpen(false);
    });
    window.addEventListener("scroll", () => {
      const services = document.getElementById("services");
      const works = document.getElementById("works");
      const contact = document.getElementById("contact");
      const home = document.getElementById("home");

      if (window.scrollY <= home.offsetTop) {
        setActive("home");
      } else if (window.scrollY < services.offsetTop - 100) {
        setActive("services");
      } else if (window.scrollY < works.offsetTop - 100) {
        setActive("works");
      } else if (window.scrollY < contact.offsetTop - 100) {
        setActive("contact");
      }
    });
  }, []);

  return (
    <header className={clsx("header", active !== "home" && "header__active")}>
      <div className="header__content">
        <Fade top>
          <button
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
              setActive("home");
            }}
            className="header__content__logo"
          >
            <span>Mehfooz</span>
            <span>ur</span>
            <span>Rehman</span>
          </button>
        </Fade>
        <ClickAwayListener onClickAway={handleClickAway}>
          {isMenuOpen ? (
            <nav className="header__content__nav">
              <Fade top>
                <button
                  className={clsx(
                    "header__content__nav__link",
                    active === "services" &&
                      "header__content__nav__link__active"
                  )}
                  onClick={() => {
                    setActive("services");
                    if (window.innerWidth < 1000) setIsMenuOpen(false);
                    document.getElementById("services").scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  Services
                </button>
              </Fade>
              <Fade top>
                <button
                  className={clsx(
                    "header__content__nav__link",
                    active === "works" && "header__content__nav__link__active"
                  )}
                  onClick={() => {
                    setActive("works");
                    if (window.innerWidth < 1000) setIsMenuOpen(false);
                    document.getElementById("works").scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  Works
                </button>
              </Fade>
              <Fade top>
                <button
                  className={clsx(
                    "header__content__nav__link",
                    active === "contact" && "header__content__nav__link__active"
                  )}
                  onClick={() => {
                    setActive("contact");
                    if (window.innerWidth < 1000) setIsMenuOpen(false);
                    document.getElementById("contact").scrollIntoView({
                      behavior: "smooth",
                    });
                  }}
                >
                  Contact
                </button>
              </Fade>
            </nav>
          ) : (
            <></>
          )}
        </ClickAwayListener>
        <div className="header__content__links">
          <Fade top>
            <a
              href="https://www.facebook.com/MehfoozurRehmanIjaz"
              target="_blank"
              className="header__content__links__link"
              title="Facebook"
            >
              <Facebook size={20} color="currentColor" />
              <span>Facebook</span>
            </a>
          </Fade>
          <Fade top>
            <a
              href="https://github.com/MehfoozurRehman"
              target="_blank"
              className="header__content__links__link"
              title="GitHub"
            >
              <GitHub size={20} color="currentColor" />
              <span>GitHub</span>
            </a>
          </Fade>
          <Fade top>
            <a
              href="mailto:mehfoozijaz786@gmail.com"
              className="header__content__links__button"
              title="Email"
            >
              <Mail size={20} color="currentColor" />
            </a>
          </Fade>
          <Fade top>
            <button
              className="header__content__links__button__menu"
              title="Menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              onMouseOver={() => setIsMenuInteracted(true)}
              onMouseOut={() => setIsMenuInteracted(false)}
            >
              <Menu size={20} color="currentColor" />
            </button>
          </Fade>
        </div>
      </div>
    </header>
  );
}

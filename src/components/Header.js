import React, { useEffect, useState } from "react";
import { Facebook, GitHub, Instagram, Linkedin, Menu, X } from "react-feather";
import NavLink from "./NavLink";

export default function Header({}) {
  const [nav, setNav] = useState(true);
  useEffect(() => {
    if (window.innerWidth < 1000) {
      setNav(false);
    } else {
      setNav(true);
    }
    window.addEventListener("resize", () => {
      if (window.innerWidth < 1000) {
        setNav(false);
      } else {
        setNav(true);
      }
    });
  }, []);

  return (
    <div className="header">
      <div className="header__content">
        <button
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
            document.getElementById("home").checked = true;
          }}
          className="header__content__logo"
        >
          <div className="header__content__logo__slogan">M.</div>
          <div className="header__content__logo__text">Mehfooz-ur-rehman</div>
        </button>
        {nav ? (
          <div className="header__content__nav">
            <NavLink defaultChecked={true} scrollTo="home">
              Home
            </NavLink>
            <NavLink scrollTo="about">About</NavLink>
            <NavLink scrollTo="services">Services</NavLink>
            <NavLink scrollTo="portfolio">Portfolio</NavLink>
            <NavLink scrollTo="clients">Clients</NavLink>
            <NavLink scrollTo="blog">Blog</NavLink>
          </div>
        ) : null}

        <div className="header__content__actions">
          <a
            href="https://github.com/MehfoozurRehman"
            className="header__content__actions__link"
          >
            <GitHub size={18} color="currentColor" />
            <span>github</span>
          </a>
          <a
            href="https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/"
            className="header__content__actions__link"
          >
            <Linkedin size={18} color="currentColor" />
            <span>linkedin</span>
          </a>
          <a
            href="https://www.instagram.com/mehfoozurrehman___/"
            className="header__content__actions__link"
          >
            <Instagram size={18} color="currentColor" />
            <span>instagram</span>
          </a>
          <a
            href="https://www.facebook.com/MehfoozurRehmanIjaz/?_rdc=1&_rdr"
            className="header__content__actions__link"
          >
            <Facebook size={18} color="currentColor" />
            <span>facebook</span>
          </a>
          <a href="#contact" className="header__content__actions__btn">
            Lets Talk
          </a>
          <button
            onClick={() => {
              nav ? setNav(false) : setNav(true);
            }}
            name="menu"
            className="header__content__menu"
          >
            {nav ? (
              <X size={18} color="currentColor" />
            ) : (
              <Menu size={18} color="currentColor" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

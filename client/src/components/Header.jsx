import React, { useEffect, useState } from "react";
import { Menu, Phone, X } from "react-feather";
import { Link } from "react-router-dom";
import { NavLink } from "../components";

export default function Header({ info }) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth < 1100) {
      setIsNavOpen(false);
    } else {
      setIsNavOpen(true);
    }
    window.addEventListener("resize", () => {
      if (window.innerWidth < 1100) {
        setIsNavOpen(false);
      } else {
        setIsNavOpen(true);
      }
    });
  }, []);
  return (
    <div className="header">
      <div className="header__wrapper">
        <Link
          to="/"
          onClick={() => {
            document.getElementById("home").checked = true;
          }}
          className="header__wrapper__logo"
        >
          <span>M</span>
          <div>ehfooz-ur-rehman</div>
        </Link>
        <div className="header__wrapper__menu">
          <div className="header__wrapper__nav__phone">
            <Phone size={20} color="currentColor" />
            <span>{info.number}</span>
          </div>
          <div className="header__wrapper__nav__bar" />
          <button
            title="menu button"
            className="header__wrapper__menu__btn"
            onClick={() => {
              isNavOpen ? setIsNavOpen(false) : setIsNavOpen(true);
            }}
          >
            {isNavOpen ? (
              <X size={20} color="currentColor" />
            ) : (
              <Menu size={20} color="currentColor" />
            )}
          </button>
        </div>
        {isNavOpen ? <Nav setIsNavOpen={setIsNavOpen} /> : null}
      </div>
    </div>
  );
}

function Nav({ setIsNavOpen }) {
  return (
    <div className="header__wrapper__nav">
      <NavLink to="/" id="home" setIsNavOpen={setIsNavOpen}>
        Home
      </NavLink>
      <NavLink
        toSection="about__section"
        id="about"
        setIsNavOpen={setIsNavOpen}
      >
        About Us
      </NavLink>
      <NavLink
        toSection="services__section"
        id="services"
        setIsNavOpen={setIsNavOpen}
      >
        Services
      </NavLink>
      <NavLink to="/portfolio" id="portfolio" setIsNavOpen={setIsNavOpen}>
        Portfolio
      </NavLink>
      <NavLink to="/contact" id="contact" setIsNavOpen={setIsNavOpen}>
        Contact
      </NavLink>
      <div className="header__wrapper__nav__bar" />
      <div className="header__wrapper__nav__phone">
        <Phone size={20} color="currentColor" />
        <span>+92 313 7178074</span>
      </div>
    </div>
  );
}

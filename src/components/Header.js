import React, { useEffect, useState } from "react";
import { Menu, Phone, X } from "react-feather";
import { Link, useNavigate } from "react-router-dom";

function NavLink({ children, to, id }) {
  const navigate = useNavigate();
  return (
    <div className="header__wrapper__nav__link">
      <input
        type="radio"
        defaultChecked={to === window.location.pathname}
        className="header__wrapper__nav__link__input"
        name="header__wrapper__nav__link__input"
        id={id}
        onClick={() => {
          navigate(to);
        }}
      />
      <div className="header__wrapper__nav__link__content">{children}</div>
    </div>
  );
}

export default function Header() {
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
            <span>+92 313 7178074</span>
          </div>
          <div className="header__wrapper__nav__bar" />
          <button
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
        {isNavOpen ? (
          <div className="header__wrapper__nav">
            <NavLink to="/" id="home">
              Home
            </NavLink>
            <NavLink to="/about" id="about">
              About Us
            </NavLink>
            <NavLink to="/services" id="services">
              Services
            </NavLink>
            <NavLink to="/portfolio" id="portfolio">
              Portfolio
            </NavLink>
            <NavLink to="/contact" id="contact">
              Contact
            </NavLink>
            <div className="header__wrapper__nav__bar" />
            <div className="header__wrapper__nav__phone">
              <Phone size={20} color="currentColor" />
              <span>+92 313 7178074</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

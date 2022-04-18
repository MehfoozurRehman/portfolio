import React from "react";
import { Facebook, GitHub, Instagram, Linkedin, Menu, X } from "react-feather";

export default function App() {
  return (
    <>
      <Header />
    </>
  );
}

function Header({}) {
  return (
    <div className="header">
      <div className="header__content">
        <div className="header__content__logo">
          <div className="header__content__logo__slogan">M.</div>
          <div className="header__content__logo__text">Mehfoozurrehman</div>
        </div>
        <button className="header__content__menu">
          <X size={18} color="currentColor" />
          <Menu size={18} color="currentColor" />
        </button>
        <div className="header__content__nav">
          <NavLink defaultChecked={true} scrollTo="home">
            Home
          </NavLink>
          <NavLink scrollTo="about">About</NavLink>
          <NavLink scrollTo="services">Services</NavLink>
          <NavLink scrollTo="portfolio">Portfolio</NavLink>
          <NavLink scrollTo="blog">Blog</NavLink>
          <NavLink scrollTo="contact">Contact</NavLink>
        </div>
        <div className="header__content__actions">
          <a
            href="https://github.com/MehfoozurRehman"
            className="header__content__actions__link"
          >
            <GitHub size={18} color="currentColor" />
          </a>
          <a
            href="https://www.linkedin.com/in/mehfooz-rehman-37a1b0231/"
            className="header__content__actions__link"
          >
            <Linkedin size={18} color="currentColor" />
          </a>
          <a
            href="https://www.instagram.com/mehfoozurrehman___/"
            className="header__content__actions__link"
          >
            <Instagram size={18} color="currentColor" />
          </a>
          <a
            href="https://www.facebook.com/MehfoozurRehmanIjaz/?_rdc=1&_rdr"
            className="header__content__actions__link"
          >
            <Facebook size={18} color="currentColor" />
          </a>
          <a href="#contact" className="header__content__actions__btn">
            Lets Talk
          </a>
        </div>
      </div>
    </div>
  );
}

function NavLink({ children, defaultChecked, scrollTo }) {
  return (
    <div className="header__content__nav__link">
      <input
        type="radio"
        name="header__content__nav__link"
        className="header__content__nav__link__input"
        defaultChecked={defaultChecked}
        onClick={() => {
          document.getElementById(scrollTo).scrollIntoView();
        }}
      />
      <div className="header__content__nav__link__content">{children}</div>
    </div>
  );
}

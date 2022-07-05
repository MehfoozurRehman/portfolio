import React from "react";
import { logo } from "../assets";
import { Link } from "react-router-dom";
import { Phone, Menu, X } from "react-feather";

export default function Header() {
  return (
    <div className="header">
      <div className="header__content">
        <Link to="/" className="header__content__logo">
          <img src={logo} alt="logo" className="header__content__logo__img" />
        </Link>
        <div className="header__content__nav">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/">Works</NavLink>
          <NavLink to="/">Notes</NavLink>
          <NavLink to="/">Contact</NavLink>
        </div>
        <div className="header__content__cta">
          <a href="#" className="header__content__cta__link">
            +92 313 7178074
            <Phone size={20} color="currentColor" />
          </a>
          <button className="header__content__cta__link">
            <Menu size={20} color="currentColor" />
            <X size={20} color="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

function NavLink({ children, ...props }) {
  return (
    <div className="header__content__nav__link">
      <input
        type="radio"
        title={children}
        className="header__content__nav__link__input"
        name="header__content__nav__link"
        {...props}
      />
      <div className="header__content__nav__link__content">{children}</div>
    </div>
  );
}

{
  /* <a href="#" className="header__content__cta__link">
<GitHub size={20} color="currentColor" />
</a>
<a href="#" className="header__content__cta__link">
<Facebook size={20} color="currentColor" />
</a>
<a href="#" className="header__content__cta__link">
<Instagram size={20} color="currentColor" />
</a>
<a href="#" className="header__content__cta__link">
<Linkedin size={20} color="currentColor" />
</a> */
}

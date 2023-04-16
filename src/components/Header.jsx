import { Link, useNavigate } from "react-router-dom";
import React, { useState } from "react";
import Logo from "./Logo";

export default function Header({}) {
  const navigate = useNavigate();
  const links = ["portfolio", "experience", "about", "contact"];
  const [activeLink, setActiveLink] = useState(links[0]);
  return (
    <div className="header">
      <div className="header__content">
        <Link to="/" className="header__content__logo">
          <Logo />
        </Link>
        <div className="header__content__nav">
          {links.map((link, index) => (
            <button
              className={
                activeLink === link
                  ? "header__content__nav__link header__content__nav__link__active"
                  : "header__content__nav__link"
              }
              key={index}
              onClick={() => {
                navigate("/");
                setTimeout(() => {
                  setActiveLink(link);
                  document
                    .getElementById(link)
                    .scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
            >
              <span>(</span> {link} <span>)</span>
            </button>
          ))}
        </div>
        <div className="header__content__links">
          <a href="" className="header__content__links__link"></a>
        </div>
      </div>
    </div>
  );
}

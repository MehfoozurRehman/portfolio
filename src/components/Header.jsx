import React from "react";
import { logo } from "../assets";
import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className="header">
      <div className="header__content">
        <Link to="/" className="header__content__logo">
          <img src={logo} alt="logo" className="header__content__logo__img" />
        </Link>
      </div>
    </div>
  );
}

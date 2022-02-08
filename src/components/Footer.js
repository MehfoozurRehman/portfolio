import React from "react";
import { ArrowUp } from "react-feather";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <div className="footer">
      <div className="footer__wrapper">
        <div className="footer__top">
          <div className="footer__wrapper__nav">
            <Link
              to="/"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
                document.getElementById("home").checked = true;
              }}
              className="footer__wrapper__nav__link"
            >
              Home
            </Link>
            <Link
              to="/"
              onClick={() => {
                document.getElementById("about__section").scrollIntoView();
                document.getElementById("about").checked = true;
              }}
              className="footer__wrapper__nav__link"
            >
              About Us
            </Link>
            <Link
              to="/"
              onClick={() => {
                document.getElementById("services__section").scrollIntoView();
                document.getElementById("services").checked = true;
              }}
              className="footer__wrapper__nav__link"
            >
              Services
            </Link>
            <Link
              to="/portfolio"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
                document.getElementById("portfolio").checked = true;
              }}
              className="footer__wrapper__nav__link"
            >
              Portfolio
            </Link>
            <Link
              to="/contact"
              onClick={() => {
                window.scrollTo({
                  top: 0,
                  behavior: "smooth",
                });
                document.getElementById("contact").checked = true;
              }}
              className="footer__wrapper__nav__link"
            >
              Contact
            </Link>
          </div>
          <button
            title="Back to top"
            onClick={() => {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            }}
            className="footer__wrapper__backtotop"
          >
            <ArrowUp size={20} color="currentColor" />
          </button>
        </div>
        <div className="footer__bottom">@2022 - copyright right reserved</div>
      </div>
    </div>
  );
}

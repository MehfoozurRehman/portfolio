import React from "react";
import "./App.scss";
import Scrollspy from "react-scrollspy";
import { PhoneCall } from "react-feather";

export default function App() {
  return (
    <>
      <Header />
      <section id="home" style={{ height: 1000 }}>
        home
      </section>
      <section id="services" style={{ height: 1000 }}>
        services
      </section>
      <section id="work" style={{ height: 1000 }}>
        work
      </section>
      <section id="experience" style={{ height: 1000 }}>
        experience
      </section>
      <section id="testimonials" style={{ height: 1000 }}>
        testimonials
      </section>
    </>
  );
}

function Header() {
  const navLinks = ["home", "services", "work", "experience", "testimonials"];
  return (
    <div className="header">
      <div className="header__content">
        <div className="header__content__logo">Mehfoozurrehman</div>
        <Scrollspy
          items={navLinks}
          currentClassName="active"
          className="header__content__nav"
          componentTag="div"
        >
          {navLinks.map((link) => (
            <button
              type="button"
              onClick={() => {
                document.getElementById(link).scrollIntoView({
                  behavior: "smooth",
                });
              }}
              title={link}
              className="header__content__nav__link"
            >
              <span>{link}</span>
            </button>
          ))}
        </Scrollspy>
        <div className="header__content__social">
          +92 313 7178074
          <a href="tel:+923137178074" className="header__content__social__link">
            <PhoneCall size={20} color="currentColor" />
          </a>
        </div>
      </div>
    </div>
  );
}

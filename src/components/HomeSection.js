import React from "react";

export default function HomeSection({}) {
  return (
    <section id="home__section" className="home__section">
      <div className="home__section__sub__heading">Hi, i am</div>
      <div className="home__section__heading">Mefooz-ur-Rehman</div>
      <div className="home__section__slogan">
        Let's Build You A <span>Digital Identity</span>
      </div>
      <div className="home__section__info">
        I'm a Web Developer based in Pakistan. Proficent in web and mobile
        deveopment. I enjoy turning complex problems into simple, beautiful and
        intuitive solutions. Working at this time for
        <span>Crazybeings Studio</span>
      </div>
      <button className="home__section__button">Check out my work!</button>
    </section>
  );
}
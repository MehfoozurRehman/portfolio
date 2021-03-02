import React from "react";
import "./Jumbotron.css";
import jumbotronPic from "../../Assets/about/aboutPic.jpg";
export default function Jumbotron() {
  return (
    <section className="section" id="jumbotron">
      <div className="section-content jumbotron-section">
        <div className="jumbotron-left">
          <div className="section-heading">
            <span>Hey I'm</span> Mehfooz-ur-Rehman
          </div>
          <div className="section-about">Let's Build Your Digital Identity</div>
          <p>Web Developer & UI/UX Designer</p>
          <p>
            Lorem ipsum dolor sit amet,Stet clita kasd gubergren, no sea
            takimata sanctus est is thelorem ipsum dolor sit amet. sed diam
            nonumy eirmod tempor invidunt ut labore et dolore is the magna
            aliquyam.
          </p>
          <div className="jumbotron-cta">
            <a href="#contact" className="nav-btn">
              Hire me!
            </a>
            <a href="#portfolio" className="nav-btn-reverse">
              Explore
            </a>
          </div>
        </div>
        <div className="jumbotron-right">
          <img src={jumbotronPic} alt="jumbotron-pic" />
        </div>
      </div>
    </section>
  );
}

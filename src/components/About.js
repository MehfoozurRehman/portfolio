import React, { useEffect, useState } from "react";
import aboutPic from "../assets/aboutPic.png";
import Fade from "react-reveal/Fade";
import axios from "axios";
import { getExperience } from "../utils/function";

export default function About() {
  const [projectsCompleted, setProjectsCompleted] = useState(0);
  const [workingFor, setWorkingFor] = useState("");
  useEffect(() => {
    axios.get("https://api.github.com/users/MehfoozurRehman").then((res) => {
      setProjectsCompleted(res.data.public_repos);
      setWorkingFor(res.data.company);
    });
  }, []);

  return (
    <div className="about__section__wrapper">
      <section id="about__section" className="about__section section">
        <div className="about__section__left">
          <Fade>
            <div className="about__section__left__experience">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M61.4,-21.8C67.3,-1.8,51.3,23.4,29.1,39.4C6.9,55.4,-21.5,62,-40.9,49.5C-60.4,37,-70.8,5.3,-62.5,-18C-54.1,-41.3,-27.1,-56.3,0.3,-56.4C27.7,-56.5,55.5,-41.8,61.4,-21.8Z"
                  transform="translate(100 100)"
                />
              </svg>
              <div className="about__section__left__experience__overlay">
                <span>{getExperience("2020-07-17")} +</span>
                Years of <br /> experience
              </div>
            </div>
          </Fade>
          <Fade>
            <div className="about__section__left__projects">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M44.3,-14.2C52.2,10.1,50,38,34.9,49.2C19.8,60.5,-8.2,55.2,-24.9,41.4C-41.5,27.6,-46.8,5.3,-40.8,-16.4C-34.7,-38.1,-17.4,-59.3,0.4,-59.4C18.1,-59.6,36.3,-38.6,44.3,-14.2Z"
                  transform="translate(100 100)"
                />
              </svg>
              <div className="about__section__left__projects__overlay">
                <span>{projectsCompleted} +</span>
                Projects <br /> completed
              </div>
            </div>
          </Fade>
          <Fade>
            <div className="about__section__left__clients">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M54.3,-18.6C59.7,-1.2,45.9,21.5,28.1,33.1C10.3,44.7,-11.5,45.3,-32,33C-52.5,20.7,-71.7,-4.4,-66.2,-22.1C-60.6,-39.8,-30.3,-50,-2.9,-49C24.5,-48.1,49,-36,54.3,-18.6Z"
                  transform="translate(100 100)"
                />
              </svg>
              <div className="about__section__left__clients__overlay">
                <span>3 +</span>
                Happy clients
              </div>
            </div>
          </Fade>
          <img
            src={aboutPic}
            alt="mehfooz ur rehman"
            className="about__section__left__img"
          />
        </div>
        <div className="about__section__right">
          <div className="about__section__right__sub__heading">
            Let me introduce myself
          </div>
          <div className="about__section__right__heading">About me</div>
          <div className="about__section__right__info">
            I'm a Web Developer based in Pakistan. I enjoy turning complex
            problems into simple, beautiful and intuitive solutions. Working at
            this time for "{workingFor}"
            <br />
            <br />I like to build functional and user-friendly and at the same
            time attractive websites for you. Moreover, I add a personal touch
            to your product and make sure that it is eye-catching and easy to
            use. My aim is to bring across your message and identity in the most
            creative way.
          </div>
          <div className="about__section__right__languages">
            🦄 <span>Skills:</span> HTML5, CSS3, JavaScript, Bootstrap, ReactJS,
            MongoDB, ExpressJS, NodeJS, Typescript, Graphql, Rest.
          </div>
          <div className="about__section__right__tools">
            💼 <span>Tools:</span> Visual Studio Code, Android Studio, GitHub
            Desktop, Windows Terminal, Firebase, Netlify, Adobe XD and Git.
          </div>
          <a href="#" className="about__section__right__button">
            Download CV
          </a>
        </div>
      </section>
    </div>
  );
}

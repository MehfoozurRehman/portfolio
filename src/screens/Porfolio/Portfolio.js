import React from "react";
import "./Portfolio.css";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import projectPic1 from "../../Assets/portfolio/project (1).png";
import projectPic2 from "../../Assets/portfolio/project (2).png";
import projectPic3 from "../../Assets/portfolio/project (3).png";
import projectPic4 from "../../Assets/portfolio/project (4).png";
import projectPic5 from "../../Assets/portfolio/project (5).png";
import projectPic6 from "../../Assets/portfolio/project (6).png";

export default function Portfolio() {
  return (
    <section className="section" id="portfolio">
      <div className="section-header">
        <div className="section-heading">Portfolio</div>
        <div className="section-about">My Work Examples</div>
      </div>
      <div className="section-content">
        <div className="portfolio-row">
          <div className="portfolio-card">
            <img
              src={projectPic2}
              alt="card-pic"
              className="portfolio-card-img"
            />
            <div className="portfolio-card-content">
              <div className="portfolio-card-content-date">
                Application Landing Page
              </div>
              <div className="portfolio-card-content-heading">
                HTML 5, CSS 3, JavaScript
              </div>
              <div className="portfolio-card-content-pattren">
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
              </div>
              <div className="portfolio-card-content-detail">
                Lorem ipsum dolor sit amet,Stet clita kasd is the most lorem
                ipsum dolor sit amet.
              </div>
              <a
                href="https://online-app-website.web.app/"
                title="learn-more"
                className="portfolio-card-content-link"
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 14.75 10.372"
                >
                  <path
                    id="arrow"
                    d="M9.933,4.83a.523.523,0,0,0-.743.736l3.769,3.769H.52A.518.518,0,0,0,0,9.856a.524.524,0,0,0,.52.528H12.959L9.189,14.146a.534.534,0,0,0,0,.743.521.521,0,0,0,.743,0l4.662-4.662a.512.512,0,0,0,0-.736Z"
                    transform="translate(0 -4.674)"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div className="portfolio-card">
            <img
              src={projectPic3}
              alt="card-pic"
              className="portfolio-card-img"
            />
            <div className="portfolio-card-content">
              <div className="portfolio-card-content-date">FBMA Corp.</div>
              <div className="portfolio-card-content-heading">
                HTML 5, CSS 3, JQuery, JavaScript, PHP, Bootstrap, Font Awesome
              </div>
              <div className="portfolio-card-content-pattren">
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
              </div>
              <div className="portfolio-card-content-detail">
                Lorem ipsum dolor sit amet,Stet clita kasd is the most lorem
                ipsum dolor sit amet.
              </div>
              <a
                href="https://github.com/MehfoozurRehman/fbmacorp"
                title="learn-more"
                className="portfolio-card-content-link"
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 14.75 10.372"
                >
                  <path
                    id="arrow"
                    d="M9.933,4.83a.523.523,0,0,0-.743.736l3.769,3.769H.52A.518.518,0,0,0,0,9.856a.524.524,0,0,0,.52.528H12.959L9.189,14.146a.534.534,0,0,0,0,.743.521.521,0,0,0,.743,0l4.662-4.662a.512.512,0,0,0,0-.736Z"
                    transform="translate(0 -4.674)"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div className="portfolio-card">
            <img
              src={projectPic4}
              alt="card-pic"
              className="portfolio-card-img"
            />
            <div className="portfolio-card-content">
              <div className="portfolio-card-content-date">AIDA Pro</div>
              <div className="portfolio-card-content-heading">
                React Js, HTML 5, CSS 3, JavaScript, Bootstrap, React Router,
                Sass
              </div>
              <div className="portfolio-card-content-pattren">
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
              </div>
              <div className="portfolio-card-content-detail">
                Lorem ipsum dolor sit amet,Stet clita kasd is the most lorem
                ipsum dolor sit amet.
              </div>
              <a
                href="https://github.com/MehfoozurRehman/Aida-Pro"
                title="learn-more"
                className="portfolio-card-content-link"
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 14.75 10.372"
                >
                  <path
                    id="arrow"
                    d="M9.933,4.83a.523.523,0,0,0-.743.736l3.769,3.769H.52A.518.518,0,0,0,0,9.856a.524.524,0,0,0,.52.528H12.959L9.189,14.146a.534.534,0,0,0,0,.743.521.521,0,0,0,.743,0l4.662-4.662a.512.512,0,0,0,0-.736Z"
                    transform="translate(0 -4.674)"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div className="portfolio-card">
            <img
              src={projectPic5}
              alt="card-pic"
              className="portfolio-card-img"
            />
            <div className="portfolio-card-content">
              <div className="portfolio-card-content-date">VS Code Editor</div>
              <div className="portfolio-card-content-heading">
                HTML 5, CSS 3, React Js, Editor.js
              </div>
              <div className="portfolio-card-content-pattren">
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
              </div>
              <div className="portfolio-card-content-detail">
                Lorem ipsum dolor sit amet,Stet clita kasd is the most lorem
                ipsum dolor sit amet.
              </div>
              <Link
                to="/project-page"
                title="learn-more"
                className="portfolio-card-content-link"
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 14.75 10.372"
                >
                  <path
                    id="arrow"
                    d="M9.933,4.83a.523.523,0,0,0-.743.736l3.769,3.769H.52A.518.518,0,0,0,0,9.856a.524.524,0,0,0,.52.528H12.959L9.189,14.146a.534.534,0,0,0,0,.743.521.521,0,0,0,.743,0l4.662-4.662a.512.512,0,0,0,0-.736Z"
                    transform="translate(0 -4.674)"
                  />
                </svg>
              </Link>
            </div>
          </div>
          <div className="portfolio-card">
            <img
              src={projectPic6}
              alt="card-pic"
              className="portfolio-card-img"
            />
            <div className="portfolio-card-content">
              <div className="portfolio-card-content-date">CSS Generator</div>
              <div className="portfolio-card-content-heading">
                HTML 5, CSS 3, JavaScript, JQuery
              </div>
              <div className="portfolio-card-content-pattren">
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
              </div>
              <div className="portfolio-card-content-detail">
                Lorem ipsum dolor sit amet,Stet clita kasd is the most lorem
                ipsum dolor sit amet.
              </div>
              <a
                href="https://github.com/MehfoozurRehman/css-generator"
                title="learn-more"
                className="portfolio-card-content-link"
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 14.75 10.372"
                >
                  <path
                    id="arrow"
                    d="M9.933,4.83a.523.523,0,0,0-.743.736l3.769,3.769H.52A.518.518,0,0,0,0,9.856a.524.524,0,0,0,.52.528H12.959L9.189,14.146a.534.534,0,0,0,0,.743.521.521,0,0,0,.743,0l4.662-4.662a.512.512,0,0,0,0-.736Z"
                    transform="translate(0 -4.674)"
                  />
                </svg>
              </a>
            </div>
          </div>
          <div className="portfolio-card">
            <img
              src={projectPic1}
              alt="card-pic"
              className="portfolio-card-img"
            />
            <div className="portfolio-card-content">
              <div className="portfolio-card-content-date">Code Pen Editor</div>
              <div className="portfolio-card-content-heading">
                React Js, HTML 5, CSS 3, JavaScript
              </div>
              <div className="portfolio-card-content-pattren">
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
                <div className="portfolio-card-content-pattren-child"></div>
              </div>
              <div className="portfolio-card-content-detail">
                Lorem ipsum dolor sit amet,Stet clita kasd is the most lorem
                ipsum dolor sit amet.
              </div>
              <a
                href="https://github.com/MehfoozurRehman/codepen-clone"
                title="learn-more"
                className="portfolio-card-content-link"
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 14.75 10.372"
                >
                  <path
                    id="arrow"
                    d="M9.933,4.83a.523.523,0,0,0-.743.736l3.769,3.769H.52A.518.518,0,0,0,0,9.856a.524.524,0,0,0,.52.528H12.959L9.189,14.146a.534.534,0,0,0,0,.743.521.521,0,0,0,.743,0l4.662-4.662a.512.512,0,0,0,0-.736Z"
                    transform="translate(0 -4.674)"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import React from "react";
import About from "./components/About";
import Header from "./components/Header";
import Home from "./components/Home";
import Portfolio from "./components/Portfolio";
import Services from "./components/Services";
import "swiper/scss";
import "swiper/scss/navigation";
import "swiper/scss/pagination";
import GitHubCalendar from "react-github-calendar";
import HTMLFlipBook from "react-pageflip";

export default function App() {
  return (
    <>
      <Header />
      <Home />
      <About />
      <Services />
      <Portfolio />
      <GitHubCalendar
        username="mehfoozurrehman"
        color="#eb4a4a"
        fontSize={14}
        year={new Date().getFullYear()}
        style={{
          color: "white",
          margin: "0em auto",
          marginBottom: "3em",
          padding: "2em",
        }}
        blockSize={18}
      />
      <HTMLFlipBook
        width={500}
        height={500}
        style={{
          margin: "0em auto",
          marginBottom: "9em",
          boxShadow: "0px 10px 30px rgba(0,0,0,.1)",
        }}
      >
        <div className="experiance__page">
          <div className="experiance__page__heading">My Education</div>
          <div className="experiance__page__sub__heading">Matric</div>
          <div className="experiance__page__info">2014 - 2016</div>
          <div className="experiance__page__content">Computer Science</div>
          <div className="experiance__page__sub__heading">Intermediate</div>
          <div className="experiance__page__info">2016 - 2018</div>
          <div className="experiance__page__content">
            ICS (Computer Science)
          </div>
          <div className="experiance__page__sub__heading">Bachelor's</div>
          <div className="experiance__page__info">2020 - till now</div>
          <div className="experiance__page__content">Computer Science</div>
        </div>
        <div className="experiance__page">
          <div className="experiance__page__heading">My Experiances</div>
          <div className="experiance__page__sub__heading">Buy Tech Zone</div>
          <div className="experiance__page__info">2019 - 2020</div>
          <div className="experiance__page__content">Amazon product finder</div>
          <div className="experiance__page__sub__heading">Creatv Hub</div>
          <div className="experiance__page__info">2020 - till now</div>
          <div className="experiance__page__content">Frontend Developer</div>
        </div>
        <div className="experiance__page">
          <div className="experiance__page__heading">My Certificates</div>
          <div className="experiance__page__sub__heading">CCA</div>
          <div className="experiance__page__info">2016</div>
          <div className="experiance__page__content">Office Applications</div>
          <div className="experiance__page__sub__heading">AutoCad</div>
          <div className="experiance__page__info">2207</div>
          <div className="experiance__page__content">Cad designing</div>
        </div>
        <div className="experiance__page__special">
          <div className="experiance__page__heading">The end</div>
          <div className="experiance__page__info">
            Lets build and grow togather
          </div>
        </div>
      </HTMLFlipBook>
    </>
  );
}

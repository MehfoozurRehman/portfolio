import { Fade } from "react-reveal";
import illustration from "../assets/illustration.svg";

export default function HeroSection() {
  return (
    <div className="hero" id="home">
      <div className="hero__content">
        <div className="hero__content__left">
          <Fade left>
            <div className="hero__content__left__slogan">
              Front End Developer
            </div>
          </Fade>
          <Fade left>
            <div className="hero__content__left__heading">
              Let's <span>Build</span> You A <span>Digital Identity</span>
            </div>
          </Fade>
          <Fade left>
            <div className="hero__content__left__info">
              I'm a Web Developer based in Pakistan. Proficent in web and mobile
              deveopment. I enjoy turning complex problems into simple,
              beautiful and intuitive solutions. Working at this time for{" "}
              <a href="https://crazy-beings.web.app/">Crazybeings Studio</a>
            </div>
          </Fade>
          <Fade left>
            <button
              onClick={() => {
                document
                  .getElementById("contact")
                  .scrollIntoView({ behavior: "smooth" });
              }}
              className="hero__content__left__button"
            >
              Lets Talk
            </button>
          </Fade>
        </div>
        <Fade right>
          <div className="hero__content__right">
            <img
              src={illustration}
              alt=""
              className="hero__content__right__img"
            />
          </div>
        </Fade>
      </div>
    </div>
  );
}

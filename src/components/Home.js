import React, { useEffect, useState } from "react";
import pic from "../assets/pic.png";
import TypeWriterEffect from "react-typewriter-effect";

export default function Home() {
  const [text, setText] = useState("Digital Identity");
  useEffect(() => {
    setTimeout(() => {
      setText("Website");
    }, 3000);
  }, []);

  return (
    <section id="home__section" className="home__section section">
      <div className="home__section__left">
        <div className="home__section__left__sub__heading">Hi there!</div>
        <div className="home__section__left__heading">
          Let's Build You A <span style={{ marginRight: ".3em" }} />
          <span>
            <TypeWriterEffect
              startDelay={0}
              cursorColor="#eb4a4a"
              multiText={[
                "Web App",
                "Mobile App",
                "Digital Identity",
                "Web App",
                "Mobile App",
                "Digital Identity",
                "Web App",
                "Mobile App",
                "Digital Identity",
                "Web App",
                "Mobile App",
                "Digital Identity",
                "Web App",
                "Mobile App",
                "Digital Identity",
              ]}
              multiTextDelay={2000}
              typeSpeed={100}
            />
          </span>
        </div>
        <div className="home__section__left__info">
          Web Developer & UI/UX Designer
        </div>
        <a href="#portfolio__section" className="home__section__left__button">
          Check out my work
        </a>
      </div>
      <div className="home__section__right">
        <img
          src={pic}
          alt="mehfoozurrehman"
          className="home__section__right__img"
        />
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path
          fillOpacity="1"
          d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,250.7C1248,256,1344,288,1392,304L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </section>
  );
}

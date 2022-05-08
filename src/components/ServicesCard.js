import React from "react";
import Fade from "react-reveal/Fade";

export default function ServicesCard({ info, title, projects, icon }) {
  return (
    <Fade>
      <div className="services__section__content__entry">
        <div className="services__section__content__entry__icon">{icon}</div>
        {/* <div className="services__section__content__entry__sub__heading">
            {projects} Projects
          </div> */}
        <div className="services__section__content__entry__heading">
          {title}
        </div>
        <div className="services__section__content__entry__info">
          {info.substring(0, 200) + "..."}
        </div>
      </div>
    </Fade>
  );
}

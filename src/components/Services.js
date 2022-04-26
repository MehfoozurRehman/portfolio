import React from "react";
import { Box, Layout, Package, Shield } from "react-feather";
import Fade from "react-reveal/Fade";

function ServicesCard({ info, title, projects, icon }) {
  return (
    <Fade>
      <div className="services__section__content__entry">
        <div className="services__section__content__entry__icon">{icon}</div>
        <div className="services__section__content__entry__sub__heading">
          {projects} Project
        </div>
        <div className="services__section__content__entry__heading">
          {title}
        </div>
        <div className="services__section__content__entry__info">{info}</div>
      </div>
    </Fade>
  );
}

export default function Services() {
  return (
    <div className="services__section__wrapper">
      <div id="services__section" className="services__section">
        <div className="services__section__sub__heading">
          What i will do for you
        </div>
        <div className="services__section__heading">Services</div>
        <div className="services__section__content section">
          <ServicesCard
            icon={<Layout size={80} color="currentColor" strokeWidth={1} />}
            projects={39}
            title="Web Development"
            info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur, a? Rerum quaerat, magni libero officiis pariatur facere natus autem fugiat minus atque sit molestiae eveniet rem alias aperiam eaque laudantium!"
          />
          <ServicesCard
            icon={<Box size={80} color="currentColor" strokeWidth={1} />}
            projects={39}
            title="Mobile Development"
            info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur, a? Rerum quaerat, magni libero officiis pariatur facere natus autem fugiat minus atque sit molestiae eveniet rem alias aperiam eaque laudantium!"
          />
          <ServicesCard
            icon={<Package size={80} color="currentColor" strokeWidth={1} />}
            projects={39}
            title="UI / UX Design"
            info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur, a? Rerum quaerat, magni libero officiis pariatur facere natus autem fugiat minus atque sit molestiae eveniet rem alias aperiam eaque laudantium!"
          />
          <ServicesCard
            icon={<Shield size={90} color="currentColor" strokeWidth={1} />}
            projects={39}
            title="SEO / Security"
            info="Lorem ipsum dolor sit amet consectetur adipisicing elit. Consequatur, a? Rerum quaerat, magni libero officiis pariatur facere natus autem fugiat minus atque sit molestiae eveniet rem alias aperiam eaque laudantium!"
          />
        </div>
      </div>
    </div>
  );
}

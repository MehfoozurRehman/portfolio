import React from "react";
import { Feather } from "react-feather";
import {} from "../components";
import ServicesCard from "./ServicesCard";
export default function ServicesSection() {
  return (
    <section className="services__section" id="services__section">
      <div className="services__section__left">
        <div className="services__section__left__col">
          <ServicesCard
            icon={<Feather size={40} color="currentColor" />}
            name="Web Development"
          />
          <ServicesCard
            icon={<Feather size={40} color="currentColor" />}
            name="UI / UX Design"
          />
          <ServicesCard
            icon={<Feather size={40} color="currentColor" />}
            name="Mobile Development"
          />
        </div>
        <div className="services__section__left__col">
          <ServicesCard
            icon={<Feather size={40} color="currentColor" />}
            name="Frontend Development"
          />
          <ServicesCard
            icon={<Feather size={40} color="currentColor" />}
            name="Backend Development"
          />
        </div>
      </div>
      <div className="services__section__right">
        <div className="services__section__right__sub__heading">
          <div className="services__section__right__sub__heading__bar"></div>
          What I do
        </div>
        <div className="services__section__right__heading">
          <span>Better design,</span>
          <span>Better experiences</span>
        </div>
        <div className="services__section__right__info">
          I can help you build nice, modern and intuative designs and then make
          them reality. I will help you build your digital identity without the
          hastle. I can build you websites, mobile apps and cms to get you
          started and more.
        </div>
      </div>
    </section>
  );
}

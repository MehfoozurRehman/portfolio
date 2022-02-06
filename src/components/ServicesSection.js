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
            name="Mobile Development"
          />
        </div>
        <div className="services__section__left__col">
          <ServicesCard
            icon={<Feather size={40} color="currentColor" />}
            name="UI / UX Design"
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
          Lorem ipsum dolor sit, amet consectetur adipisicing elit. Accusamus,
          eos doloremque. Autem ipsa aliquid quia. Quibusdam quo tenetur, illum
          veritatis similique possimus fugiat molestias ut porro aspernatur
          corporis commodi eligendi.
        </div>
      </div>
    </section>
  );
}

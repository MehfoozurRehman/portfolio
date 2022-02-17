import React from "react";
import {
  AboutSection,
  HomeSection,
  PortfolioSection,
  ServicesSection,
  TestimonialsSection,
} from "../components";
function SkillsCard({ image, name }) {
  return (
    <div className="skills__section__content__entry">
      <img
        src={image}
        alt={name}
        className="skills__section__content__entry__img"
      />
      <span>{name}</span>
    </div>
  );
}
export default function Home() {
  return (
    <>
      <HomeSection />
      <ServicesSection />
      <AboutSection />
      <section className="skills__section">
        <div className="services__section__right__sub__heading">
          <div className="services__section__right__sub__heading__bar"></div>
          Skills
        </div>
        <div className="services__section__right__heading">What can I do</div>
        <div className="skills__section__content">
          <SkillsCard
            image="https://cdn-icons-png.flaticon.com/512/732/732212.png"
            name="HTML 5"
          />
          <SkillsCard
            image="https://cdn-icons-png.flaticon.com/512/732/732190.png"
            name="CSS 3"
          />
          <SkillsCard
            image="https://cdn-icons-png.flaticon.com/512/5968/5968292.png"
            name="JavaScript"
          />
          <SkillsCard
            image="https://cdn-icons-png.flaticon.com/512/1260/1260667.png"
            name="React Js"
          />
          <SkillsCard
            image="https://cdn-icons-png.flaticon.com/512/1260/1260775.png"
            name="React Native"
          />
          <SkillsCard
            image="https://cdn-icons-png.flaticon.com/512/919/919825.png"
            name="Node Js"
          />
          <SkillsCard
            image="https://cdn-icons.flaticon.com/png/512/5611/premium/5611129.png?token=exp=1644297731~hmac=4ad5fbe633b868f8987ef57d49e459cf"
            name="Adobe Xd"
          />
          <SkillsCard
            image="https://cdn-icons-png.flaticon.com/512/5968/5968672.png"
            name="Bootstrap"
          />
          <SkillsCard
            image="https://res.cloudinary.com/crunchbase-production/image/upload/c_lpad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_1/erkxwhl1gd48xfhe2yld"
            name="MongoDb"
          />
        </div>
      </section>
      <PortfolioSection />
      <TestimonialsSection />
    </>
  );
}

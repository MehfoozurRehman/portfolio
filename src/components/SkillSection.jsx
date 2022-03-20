import React from "react";

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
export default function SkillSection({ info }) {
  return (
    <section className="skills__section">
      <div className="services__section__right__sub__heading">
        <div className="services__section__right__sub__heading__bar"></div>
        Skills
      </div>
      <div className="services__section__right__heading">What can I do</div>
      <div className="skills__section__content">
        {info.skills.map((item, i) => (
          <SkillsCard key={i} image={item.image} name={item.name} />
        ))}
      </div>
    </section>
  );
}

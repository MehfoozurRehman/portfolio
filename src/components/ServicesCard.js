import React from "react";

export default function ServicesCard({ title, skills }) {
  return (
    <div className="services__section__content__entry">
      <div className="services__section__content__entry__heading">{title}</div>
      <div className="services__section__content__entry__info">
        {skills.map((skill, i) =>
          i !== skills.length - 1 ? skill + ", " : skill
        )}
      </div>
    </div>
  );
}

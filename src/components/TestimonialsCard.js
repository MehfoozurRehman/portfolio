import React from "react";
import { pic } from "../assets";

export default function TestimonialsCard() {
  return (
    <div className="testimonials__card">
      <div className="testimonials__card__header">
        <div className="testimonials__card__header__box">
          <img
            src={pic}
            alt="pic"
            className="testimonials__card__header__box__img"
          />
        </div>
        <div className="testimonials__card__header__content">
          <div className="testimonials__card__header__content__heading">
            Ibraham Shahid
          </div>
          <div className="testimonials__card__header__content__sub__heading">
            UI / UX Developer
          </div>
        </div>
      </div>
      <div className="testimonials__card__header__info">
        Lorem ipsum, dolor sit amet consectetur adipisicing elit. Aspernatur
        dolores consequuntur exercitationem quod et sed ea animi ipsa iure
        cupiditate consectetur porro non asperiores quasi illo, est aliquid
        tempora repellat?
      </div>
    </div>
  );
}
